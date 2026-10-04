import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GitBranch, AlertTriangle } from 'lucide-react';
import { SectionHeader, LoadingSpinner, ErrorState, Disclaimer, CHART_TOOLTIP_STYLE, CHART_AXIS_TICK } from './ui';
import { fetchAllEmployees, computeDepartmentSummaries, getDepartmentAverages } from '@/lib/dataAccess';
import { computeFactorContributions, getRiskLevel } from '@/lib/riskEngine';
import type { EmployeePulse } from '@/types';
import { DEPARTMENTS, FACTOR_KEYS, FACTOR_LABELS } from '@/types';

const FACTOR_COLORS: Record<string, string> = {
  'Career Growth': '#8b5cf6',
  'Recognition': '#3366ff',
  'Workload': '#ef4444',
  'Manager Support': '#f59e0b',
  'Work-Life Balance': '#06b6d4',
  'Motivation': '#ec4899',
  'Job Satisfaction': '#10b981',
};

export function RootCauseAnalysis() {
  const [employees, setEmployees] = useState<EmployeePulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>('Sales');

  useEffect(() => {
    fetchAllEmployees()
      .then((data) => { setEmployees(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const summaries = useMemo(() => computeDepartmentSummaries(employees), [employees]);

  const selectedSummary = useMemo(
    () => summaries.find((s) => s.department === selectedDept),
    [summaries, selectedDept]
  );

  const contributions = useMemo(() => {
    if (!selectedSummary) return [];
    const avgFactors = getDepartmentAverages(selectedSummary);
    return computeFactorContributions(avgFactors);
  }, [selectedSummary]);

  const factorAverages = useMemo(() => {
    if (!selectedSummary) return [];
    const avg = getDepartmentAverages(selectedSummary);
    return FACTOR_KEYS.map((k) => ({
      factor: FACTOR_LABELS[k],
      avg: avg[k],
      pct: Math.round((avg[k] / 5) * 100),
    }));
  }, [selectedSummary]);

  if (loading) return <LoadingSpinner label="Loading root cause analysis..." />;
  if (error) return <ErrorState message={error} />;

  const riskLevel = selectedSummary ? getRiskLevel(selectedSummary.avg_risk) : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Root Cause Analysis"
        subtitle="Why is this department at risk? Visual breakdown of contributing workplace factors"
        icon={<GitBranch className="w-5 h-5" />}
      />

      {/* Department selector */}
      <div className="card">
        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-3">Select Department</label>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((d) => {
            const summary = summaries.find((s) => s.department === d);
            const risk = summary ? getRiskLevel(summary.avg_risk) : null;
            return (
              <button
                key={d}
                onClick={() => setSelectedDept(d)}
                className={`dept-pill ${
                  selectedDept === d
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'bg-slate-50 text-navy-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {d}
                {risk && (
                  <span className={`w-2 h-2 rounded-full ${
                    risk.label === 'High' ? 'bg-red-500' : risk.label === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedSummary && riskLevel && (
        <>
          {/* Risk summary */}
          <div className="card bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white border-navy-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight-2">{selectedSummary.department} Department</h3>
                  <p className="text-sm text-navy-300 mt-0.5">
                    {selectedSummary.total} employees · Avg pulse {selectedSummary.avg_pulse} · {selectedSummary.high_risk_count} high-risk
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xs font-bold uppercase tracking-wider text-navy-400">Estimated Risk</p>
                <p className={`text-3xl font-extrabold leading-none mt-1 ${riskLevel.label === 'High' ? 'text-red-400' : riskLevel.label === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {selectedSummary.avg_risk}%
                </p>
                <span className={`badge mt-2 ${
                  riskLevel.label === 'High' ? 'bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/20' :
                  riskLevel.label === 'Medium' ? 'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/20' :
                  'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/20'
                }`}>{riskLevel.label} Risk</span>
              </div>
            </div>
          </div>

          {/* Contribution chart */}
          <div className="card">
            <div className="mb-5">
              <h3 className="font-bold text-navy-900 tracking-tight-2">Why is this department at risk?</h3>
              <p className="text-xs text-slate-400 mt-0.5">Contribution of each workplace factor to the estimated risk</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={contributions} layout="vertical" margin={{ left: 20, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 40]} tick={CHART_AXIS_TICK} unit="%" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={{ ...CHART_AXIS_TICK, fill: '#475569' }} width={120} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} formatter={(value) => [`${value}%`, 'Contribution']} />
                <Bar dataKey="contribution" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {contributions.map((c) => (
                    <Cell key={c.factor} fill={FACTOR_COLORS[c.label] ?? '#3366ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Factor detail cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {factorAverages.map((f) => (
              <div key={f.factor} className="card card-hover">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">{f.factor}</p>
                <p className="text-2xl font-extrabold text-navy-900 mt-1.5 leading-none">{f.avg}<span className="text-base text-slate-300 font-bold">/5</span></p>
                <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      f.pct >= 70 ? 'bg-emerald-500' : f.pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
                <p className={`text-xs font-semibold mt-2 ${f.pct >= 70 ? 'text-emerald-600' : f.pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  {f.pct >= 70 ? 'Healthy' : f.pct >= 40 ? 'Needs Attention' : 'Critical'}
                </p>
              </div>
            ))}
          </div>

          {/* Top factors callout */}
          <div className="card border-l-[3px] border-l-red-500 bg-red-50/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-navy-900 tracking-tight-2">Top Contributing Factors</h4>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  The strongest drivers of risk in <span className="font-bold">{selectedSummary.department}</span> are{' '}
                  <span className="font-bold text-red-600">{contributions[0]?.label}</span> ({contributions[0]?.contribution}%)
                  {contributions[1] && (
                    <> and <span className="font-bold text-red-600">{contributions[1]?.label}</span> ({contributions[1]?.contribution}%)</>
                  )}.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <Disclaimer text="Contributing factors are derived from aggregated, anonymous pulse survey data. No individual employee data is exposed." />
    </div>
  );
}
