import { supabase } from './supabase';
import type { EmployeePulse, DepartmentSummary, FactorKey } from '@/types';
import { FACTOR_KEYS } from '@/types';
import { getRiskLevel } from './riskEngine';

export async function fetchAllEmployees(): Promise<EmployeePulse[]> {
  const { data, error } = await supabase
    .from('employee_pulse')
    .select('*')
    .order('estimated_attrition_risk', { ascending: false });
  if (error) throw error;
  return (data as EmployeePulse[]) ?? [];
}

export async function fetchEmployeesByDepartment(dept: string): Promise<EmployeePulse[]> {
  const { data, error } = await supabase
    .from('employee_pulse')
    .select('*')
    .eq('department', dept)
    .order('estimated_attrition_risk', { ascending: false });
  if (error) throw error;
  return (data as EmployeePulse[]) ?? [];
}

export async function insertPulseResponse(
  response: Omit<EmployeePulse, 'id' | 'created_at' | 'pulse_score' | 'estimated_attrition_risk' | 'employee_id'>
): Promise<EmployeePulse | null> {
  const { data, error } = await supabase
    .from('employee_pulse')
    .insert({
      ...response,
      employee_id: `PULSE-${Date.now().toString().slice(-6)}`,
    })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as EmployeePulse | null;
}

export function computeDepartmentSummaries(employees: EmployeePulse[]): DepartmentSummary[] {
  const deptMap = new Map<string, EmployeePulse[]>();

  for (const emp of employees) {
    if (!deptMap.has(emp.department)) deptMap.set(emp.department, []);
    deptMap.get(emp.department)!.push(emp);
  }

  const summaries: DepartmentSummary[] = [];

  for (const [dept, emps] of deptMap) {
    const avg = (selector: (e: EmployeePulse) => number) =>
      Math.round(emps.reduce((sum, e) => sum + selector(e), 0) / emps.length);

    const high = emps.filter((e) => getRiskLevel(e.estimated_attrition_risk).label === 'High').length;
    const medium = emps.filter((e) => getRiskLevel(e.estimated_attrition_risk).label === 'Medium').length;
    const low = emps.filter((e) => getRiskLevel(e.estimated_attrition_risk).label === 'Low').length;

    summaries.push({
      department: dept,
      total: emps.length,
      avg_pulse: avg((e) => e.pulse_score),
      avg_risk: avg((e) => e.estimated_attrition_risk),
      avg_workload: avg((e) => e.workload),
      avg_recognition: avg((e) => e.recognition),
      avg_career_growth: avg((e) => e.career_growth),
      avg_manager_support: avg((e) => e.manager_support),
      avg_work_life_balance: avg((e) => e.work_life_balance),
      avg_motivation: avg((e) => e.motivation),
      avg_job_satisfaction: avg((e) => e.job_satisfaction),
      high_risk_count: high,
      medium_risk_count: medium,
      low_risk_count: low,
    });
  }

  return summaries.sort((a, b) => b.avg_risk - a.avg_risk);
}

export function getDepartmentAverages(
  summary: DepartmentSummary
): Record<FactorKey, number> {
  return {
    workload: summary.avg_workload,
    recognition: summary.avg_recognition,
    career_growth: summary.avg_career_growth,
    manager_support: summary.avg_manager_support,
    work_life_balance: summary.avg_work_life_balance,
    motivation: summary.avg_motivation,
    job_satisfaction: summary.avg_job_satisfaction,
  };
}

export { FACTOR_KEYS };
