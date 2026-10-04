/**
 * AI Service Abstraction
 *
 * This module provides a pluggable interface for connecting an LLM API.
 * If VITE_AI_API_KEY and VITE_AI_API_URL are set in the environment, the
 * service calls the external LLM. Otherwise, it falls back to a local
 * rule-based reasoning engine that produces structured HR recommendations
 * from the same data inputs.
 *
 * To connect a real LLM:
 *   VITE_AI_API_URL=https://your-llm-endpoint/v1/chat/completions
 *   VITE_AI_API_KEY=your-api-key
 */

import type { DepartmentSummary, FactorKey } from '@/types';
import { FACTOR_KEYS, FACTOR_LABELS } from '@/types';
import { computeFactorContributions } from './riskEngine';

export interface AIInsight {
  concern: string;
  reasons: string[];
  immediateAction: string;
  mediumTermAction: string;
  developmentRecommendation: string;
}

export interface AIWorkforceInsight {
  summary: string;
  topDepartment: string;
  topFactors: string[];
}

interface AIConfig {
  apiUrl?: string;
  apiKey?: string;
}

function getConfig(): AIConfig {
  return {
    apiUrl: import.meta.env.VITE_AI_API_URL as string | undefined,
    apiKey: import.meta.env.VITE_AI_API_KEY as string | undefined,
  };
}

export function isLLMConfigured(): boolean {
  const config = getConfig();
  return !!(config.apiUrl && config.apiKey);
}

/**
 * Generate a workforce-level insight summarizing overall risk.
 */
export async function generateWorkforceInsight(
  summaries: DepartmentSummary[]
): Promise<AIWorkforceInsight> {
  const config = getConfig();
  if (config.apiUrl && config.apiKey) {
    try {
      const prompt = buildWorkforcePrompt(summaries);
      const result = await callLLM(config, prompt);
      return parseWorkforceResult(result, summaries);
    } catch {
      return localWorkforceInsight(summaries);
    }
  }
  return localWorkforceInsight(summaries);
}

/**
 * Generate department-level HR recommendations.
 */
export async function generateDepartmentInsight(
  summary: DepartmentSummary
): Promise<AIInsight> {
  const config = getConfig();
  if (config.apiUrl && config.apiKey) {
    try {
      const prompt = buildDepartmentPrompt(summary);
      const result = await callLLM(config, prompt);
      return parseInsightResult(result, summary);
    } catch {
      return localDepartmentInsight(summary);
    }
  }
  return localDepartmentInsight(summary);
}

/**
 * Generate a recommendation for a simulation result.
 */
export async function generateSimulationRecommendation(
  interventionNames: string[],
  pulseDelta: number,
  riskDelta: number
): Promise<string> {
  const config = getConfig();
  if (config.apiUrl && config.apiKey) {
    try {
      const prompt = `An HR simulator tested these interventions: ${interventionNames.join(', ')}.
The pulse score changed by ${pulseDelta > 0 ? '+' : ''}${pulseDelta} points and
attrition risk changed by ${riskDelta > 0 ? '+' : ''}${riskDelta} points.
Write one concise sentence (max 30 words) recommending whether these interventions are worth pursuing.`;
      const result = await callLLM(config, prompt);
      return result.trim();
    } catch {
      return localSimRecommendation(interventionNames, pulseDelta, riskDelta);
    }
  }
  return localSimRecommendation(interventionNames, pulseDelta, riskDelta);
}

// === LLM call ===

async function callLLM(config: AIConfig, prompt: string): Promise<string> {
  const response = await fetch(config.apiUrl!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });
  if (!response.ok) throw new Error(`LLM API error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// === Prompts ===

function buildWorkforcePrompt(summaries: DepartmentSummary[]): string {
  const deptData = summaries
    .map(
      (s) =>
        `${s.department}: pulse ${s.avg_pulse}, risk ${s.avg_risk}, high-risk employees ${s.high_risk_count}`
    )
    .join('; ');
  return `You are an HR analytics assistant. Given these department metrics: ${deptData}.
Provide a 1-2 sentence insight identifying which department shows the highest disengagement risk
and the top contributing factors. Respond in plain text.`;
}

function buildDepartmentPrompt(summary: DepartmentSummary): string {
  const factors = FACTOR_KEYS.map((k) => `${FACTOR_LABELS[k]}: ${scoreToVal(summary, k)}/5`).join(', ');
  return `You are an HR analytics assistant. Department: ${summary.department}.
Average scores (1-5): ${factors}. Pulse score: ${summary.avg_pulse}/100.
Estimated attrition risk: ${summary.avg_risk}%.
Provide structured HR recommendations as JSON with keys: concern, reasons (array of strings),
immediateAction, mediumTermAction, developmentRecommendation.`;
}

function scoreToVal(summary: DepartmentSummary, key: FactorKey): number {
  const map: Record<FactorKey, number> = {
    workload: summary.avg_workload,
    recognition: summary.avg_recognition,
    career_growth: summary.avg_career_growth,
    manager_support: summary.avg_manager_support,
    work_life_balance: summary.avg_work_life_balance,
    motivation: summary.avg_motivation,
    job_satisfaction: summary.avg_job_satisfaction,
  };
  return map[key];
}

// === Parsers ===

function parseWorkforceResult(result: string, summaries: DepartmentSummary[]): AIWorkforceInsight {
  const sorted = [...summaries].sort((a, b) => b.avg_risk - a.avg_risk);
  const topDept = sorted[0];
  const contributions = computeFactorContributions({
    workload: topDept.avg_workload,
    recognition: topDept.avg_recognition,
    career_growth: topDept.avg_career_growth,
    manager_support: topDept.avg_manager_support,
    work_life_balance: topDept.avg_work_life_balance,
    motivation: topDept.avg_motivation,
    job_satisfaction: topDept.avg_job_satisfaction,
  });
  return {
    summary: result.trim(),
    topDepartment: topDept.department,
    topFactors: contributions.slice(0, 3).map((c) => c.label),
  };
}

function parseInsightResult(result: string, summary: DepartmentSummary): AIInsight {
  try {
    const parsed = JSON.parse(result);
    return {
      concern: parsed.concern ?? '',
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      immediateAction: parsed.immediateAction ?? '',
      mediumTermAction: parsed.mediumTermAction ?? '',
      developmentRecommendation: parsed.developmentRecommendation ?? '',
    };
  } catch {
    return localDepartmentInsight(summary);
  }
}

// === Local fallback reasoning engine ===

function localWorkforceInsight(summaries: DepartmentSummary[]): AIWorkforceInsight {
  const sorted = [...summaries].sort((a, b) => b.avg_risk - a.avg_risk);
  const topDept = sorted[0];

  const contributions = computeFactorContributions({
    workload: topDept.avg_workload,
    recognition: topDept.avg_recognition,
    career_growth: topDept.avg_career_growth,
    manager_support: topDept.avg_manager_support,
    work_life_balance: topDept.avg_work_life_balance,
    motivation: topDept.avg_motivation,
    job_satisfaction: topDept.avg_job_satisfaction,
  });

  const topFactors = contributions.slice(0, 3).map((c) => c.label.toLowerCase());

  return {
    summary: `${topDept.department} currently shows the highest disengagement risk (${topDept.avg_risk}%), mainly associated with ${topFactors.join(', ')}.`,
    topDepartment: topDept.department,
    topFactors: contributions.slice(0, 3).map((c) => c.label),
  };
}

function localDepartmentInsight(summary: DepartmentSummary): AIInsight {
  const contributions = computeFactorContributions({
    workload: summary.avg_workload,
    recognition: summary.avg_recognition,
    career_growth: summary.avg_career_growth,
    manager_support: summary.avg_manager_support,
    work_life_balance: summary.avg_work_life_balance,
    motivation: summary.avg_motivation,
    job_satisfaction: summary.avg_job_satisfaction,
  });

  const top = contributions[0];
  const second = contributions[1];

  const concernMap: Record<string, string> = {
    'Career Growth': 'Limited career growth opportunities',
    Recognition: 'Low employee recognition',
    Workload: 'High workload pressure',
    'Manager Support': 'Insufficient manager support',
    'Work-Life Balance': 'Poor work-life balance',
    Motivation: 'Declining employee motivation',
    'Job Satisfaction': 'Low overall job satisfaction',
  };

  const immediateMap: Record<string, string> = {
    'Career Growth': 'Schedule career path conversations between managers and team members within the next two weeks.',
    Recognition: 'Introduce a monthly peer-nomination recognition program and have managers deliver specific feedback in team meetings.',
    Workload: 'Audit current task assignments and redistribute or defer non-critical work this sprint.',
    'Manager Support': 'Conduct manager check-ins with each team member this week to surface blockers and concerns.',
    'Work-Life Balance': 'Implement a no-meeting Friday policy and encourage teams to respect focus time blocks.',
    Motivation: 'Connect team members to purpose-driven projects and celebrate recent wins in the next team meeting.',
    'Job Satisfaction': 'Run quick pulse interviews to understand specific dissatisfaction drivers and address the top theme within 30 days.',
  };

  const mediumMap: Record<string, string> = {
    'Career Growth': 'Create individual development plans with quarterly milestones and pair each employee with a mentor.',
    Recognition: 'Embed recognition into weekly rituals and tie a portion of manager performance goals to team recognition frequency.',
    Workload: 'Review team capacity quarterly and adjust hiring or automation to match sustained demand.',
    'Manager Support': 'Enroll managers in a coaching-skills program and add 360-degree feedback in the next review cycle.',
    'Work-Life Balance': 'Pilot flexible scheduling for one quarter and measure engagement impact before rolling out broadly.',
    Motivation: 'Rotate ownership of high-visibility initiatives so team members gain exposure and ownership.',
    'Job Satisfaction': 'Form a cross-functional working group to address structural issues and report progress monthly.',
  };

  const devMap: Record<string, string> = {
    'Career Growth': 'Fund one certification or course per employee per quarter and create internal job-shadowing opportunities.',
    Recognition: 'Train managers on structured feedback frameworks and recognize contributions in company-wide channels.',
    Workload: 'Invest in workflow automation tools to reduce manual recurring tasks by at least 20%.',
    'Manager Support': 'Establish a manager peer-coaching circle that meets bi-weekly to share challenges and practices.',
    'Work-Life Balance': 'Offer wellness stipends and provide access to mental-health resources as a standard benefit.',
    Motivation: 'Sponsor attendance at one industry conference per year and create innovation time for passion projects.',
    'Job Satisfaction': 'Launch a stay-interview program to proactively understand what keeps employees engaged.',
  };

  const concern = concernMap[top.label] ?? `Elevated ${top.label.toLowerCase()} risk`;
  const reasons = [
    `${top.label} contributes ${top.contribution}% of the estimated risk for this department.`,
    `${second.label} is the second strongest factor at ${second.contribution}%.`,
    `The average pulse score of ${summary.avg_pulse}/100 indicates ${summary.avg_pulse < 50 ? 'critical' : summary.avg_pulse < 80 ? 'moderate' : 'healthy'} engagement.`,
  ];

  return {
    concern,
    reasons,
    immediateAction: immediateMap[top.label] ?? 'Investigate the top contributing factor with department leadership.',
    mediumTermAction: mediumMap[top.label] ?? 'Develop a 90-day improvement plan targeting the primary risk factors.',
    developmentRecommendation: devMap[top.label] ?? 'Invest in employee development programs aligned with the identified gaps.',
  };
}

function localSimRecommendation(
  interventionNames: string[],
  pulseDelta: number,
  riskDelta: number
): string {
  if (pulseDelta <= 0 && riskDelta >= 0) {
    return 'These interventions did not produce a meaningful simulated improvement. Consider testing alternative combinations.';
  }
  if (riskDelta < -20) {
    return `${interventionNames.join(' and ')} produced the strongest simulated improvement, reducing estimated attrition risk by ${Math.abs(riskDelta)} points. Consider prioritizing these interventions.`;
  }
  if (riskDelta < -10) {
    return `${interventionNames.join(' and ')} showed a moderate simulated improvement. A phased rollout with ongoing measurement is recommended.`;
  }
  return `${interventionNames.join(' and ')} produced a modest simulated improvement. Consider combining with additional interventions for stronger impact.`;
}
