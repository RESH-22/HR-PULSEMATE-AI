import type { EmployeePulse, FactorKey } from '@/types';
import { FACTOR_KEYS } from '@/types';

/**
 * Prototype risk-scoring engine.
 *
 * This is NOT a trained ML model. It is a transparent, weighted scoring formula
 * that converts 1-5 agreement scores into a 0-100 pulse score and a 0-100
 * estimated attrition risk. It is designed to be replaced by a trained
 * Random Forest model (or similar) in a production deployment.
 *
 * The weights reflect typical workplace research findings:
 * - Career growth and recognition are the strongest attrition drivers
 * - Workload and manager support are secondary
 * - Work-life balance, motivation, and job satisfaction moderate the score
 */

const FACTOR_WEIGHTS: Record<FactorKey, number> = {
  career_growth: 0.20,
  recognition: 0.18,
  workload: 0.15,
  manager_support: 0.14,
  work_life_balance: 0.13,
  job_satisfaction: 0.11,
  motivation: 0.09,
};

/**
 * Convert a single 1-5 score to a 0-100 scale.
 * 1 = 0, 5 = 100
 */
export function scoreToPct(score: number): number {
  return Math.round(((score - 1) / 4) * 100);
}

/**
 * Compute a pulse score (0-100) from 7 factor scores (each 1-5).
 */
export function computePulseScore(factors: Record<FactorKey, number>): number {
  let total = 0;
  for (const key of FACTOR_KEYS) {
    const pct = scoreToPct(factors[key]);
    total += pct * FACTOR_WEIGHTS[key];
  }
  return Math.round(Math.max(0, Math.min(100, total)));
}

/**
 * Estimate attrition risk (0-100) from pulse score.
 * Lower pulse score = higher risk, with a non-linear curve.
 */
export function estimateAttritionRisk(pulseScore: number): number {
  const risk = 100 - pulseScore * 0.85;
  return Math.round(Math.max(0, Math.min(100, risk)));
}

export function getRiskLevel(risk: number): { label: 'Low' | 'Medium' | 'High'; color: string } {
  if (risk >= 61) return { label: 'High', color: 'text-red-600' };
  if (risk >= 31) return { label: 'Medium', color: 'text-amber-600' };
  return { label: 'Low', color: 'text-emerald-600' };
}

export function getPulseClassification(pulse: number): { label: string; color: string } {
  if (pulse >= 80) return { label: 'Healthy', color: 'text-emerald-600' };
  if (pulse >= 50) return { label: 'Needs Attention', color: 'text-amber-600' };
  return { label: 'Critical', color: 'text-red-600' };
}

export function getWorkloadLabel(score: number): 'Low' | 'Medium' | 'High' {
  if (score <= 2) return 'High';
  if (score <= 3) return 'Medium';
  return 'Low';
}

/**
 * Root-cause contribution: for a given set of factor averages (1-5),
 * compute the percentage contribution of each factor to the overall risk.
 * Factors with lower scores contribute more to risk.
 */
export function computeFactorContributions(
  avgFactors: Record<FactorKey, number>
): { factor: FactorKey; label: string; contribution: number }[] {
  const weightedRisk: { factor: FactorKey; label: string; value: number }[] = FACTOR_KEYS.map((key) => {
    const riskPct = 100 - scoreToPct(avgFactors[key]);
    return {
      factor: key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value: riskPct * FACTOR_WEIGHTS[key],
    };
  });

  const total = weightedRisk.reduce((sum, w) => sum + w.value, 0) || 1;

  return weightedRisk
    .map((w) => ({
      factor: w.factor,
      label: w.label,
      contribution: Math.round((w.value / total) * 100),
    }))
    .sort((a, b) => b.contribution - a.contribution);
}

/**
 * Simulate an intervention: given current avg factors and adjustments,
 * compute the new pulse score and attrition risk.
 * Adjustments range from -3 (worsen) to +3 (improve) on the 1-5 scale.
 */
export function simulateIntervention(
  currentFactors: Record<FactorKey, number>,
  adjustments: Partial<Record<FactorKey, number>> & { training?: number }
): {
  simulatedPulse: number;
  simulatedRisk: number;
  simulatedWorkloadLabel: string;
  simulatedSatisfaction: number;
  factorChanges: Record<FactorKey, number>;
} {
  const newFactors = { ...currentFactors };

  const factorAdjustments: Partial<Record<FactorKey, number>> = {};
  if (adjustments.workload !== undefined) factorAdjustments.workload = adjustments.workload;
  if (adjustments.recognition !== undefined) factorAdjustments.recognition = adjustments.recognition;
  if (adjustments.career_growth !== undefined) factorAdjustments.career_growth = adjustments.career_growth;
  if (adjustments.manager_support !== undefined) factorAdjustments.manager_support = adjustments.manager_support;
  if (adjustments.work_life_balance !== undefined) factorAdjustments.work_life_balance = adjustments.work_life_balance;

  // Training improves career growth and motivation indirectly
  if (adjustments.training) {
    factorAdjustments.career_growth = (factorAdjustments.career_growth || 0) + Math.floor(adjustments.training * 0.5);
    factorAdjustments.motivation = (factorAdjustments.motivation || 0) + Math.floor(adjustments.training * 0.5);
  }

  const factorChanges = {} as Record<FactorKey, number>;
  for (const key of FACTOR_KEYS) {
    const adj = factorAdjustments[key] || 0;
    newFactors[key] = Math.max(1, Math.min(5, currentFactors[key] + adj));
    factorChanges[key] = newFactors[key] - currentFactors[key];
  }

  const simulatedPulse = computePulseScore(newFactors);
  const simulatedRisk = estimateAttritionRisk(simulatedPulse);
  const simulatedSatisfaction = scoreToPct(newFactors.job_satisfaction);
  const simulatedWorkloadLabel = getWorkloadLabel(6 - newFactors.workload); // invert: lower score = higher workload

  return {
    simulatedPulse,
    simulatedRisk,
    simulatedWorkloadLabel,
    simulatedSatisfaction,
    factorChanges,
  };
}
