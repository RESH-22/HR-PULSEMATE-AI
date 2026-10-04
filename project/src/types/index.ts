export interface EmployeePulse {
  id: string;
  employee_id: string;
  department: string;
  workload: number;
  recognition: number;
  career_growth: number;
  manager_support: number;
  work_life_balance: number;
  motivation: number;
  job_satisfaction: number;
  pulse_score: number;
  estimated_attrition_risk: number;
  created_at: string;
}

export interface Scenario {
  id: string;
  name: string;
  department: string | null;
  workload_adjustment: number;
  recognition_adjustment: number;
  career_growth_adjustment: number;
  manager_support_adjustment: number;
  work_life_balance_adjustment: number;
  training_adjustment: number;
  simulated_pulse_score: number;
  simulated_attrition_risk: number;
  simulated_workload_label: string;
  simulated_satisfaction: number;
  created_at: string;
}

export interface DepartmentSummary {
  department: string;
  total: number;
  avg_pulse: number;
  avg_risk: number;
  avg_workload: number;
  avg_recognition: number;
  avg_career_growth: number;
  avg_manager_support: number;
  avg_work_life_balance: number;
  avg_motivation: number;
  avg_job_satisfaction: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

export interface RiskLevel {
  label: 'Low' | 'Medium' | 'High';
  color: string;
}

export const FACTOR_KEYS = [
  'workload',
  'recognition',
  'career_growth',
  'manager_support',
  'work_life_balance',
  'motivation',
  'job_satisfaction',
] as const;

export type FactorKey = (typeof FACTOR_KEYS)[number];

export const FACTOR_LABELS: Record<FactorKey, string> = {
  workload: 'Workload',
  recognition: 'Recognition',
  career_growth: 'Career Growth',
  manager_support: 'Manager Support',
  work_life_balance: 'Work-Life Balance',
  motivation: 'Motivation',
  job_satisfaction: 'Job Satisfaction',
};

export const DEPARTMENTS = ['Sales', 'Operations', 'IT', 'Finance', 'Marketing', 'HR'] as const;
