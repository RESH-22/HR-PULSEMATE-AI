import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from 'recharts';
import {
  Users, HeartPulse, AlertTriangle, TrendingUp, Building2, MessageSquare,
  Sparkles, Loader2, LayoutDashboard,
} from 'lucide-react';
import { fetchAllEmployees, computeDepartmentSummaries } from '@/lib/dataAccess';
import type { EmployeePulse } from '@/types';
import { KpiCard, SectionHeader, LoadingSpinner, ErrorState, Disclaimer, ChartCard, CHART_TOOLTIP_STYLE, CHART_AXIS_TICK } from './ui';
import { generateWorkforceInsight } from '@/lib/aiService';
import type { AIWorkforceInsight } from '@/lib/aiService';

export function Dashboard() {
  const [employees, setEmployees] = useState<EmployeePulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<AIWorkforceInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    fetchAllEmployees()
      .then((data) => { setEmployees(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const summaries = useMemo(() => computeDepartmentSummaries(employees), [employees]);

  const kpis = useMemo(() => {
    if (employees.length === 0) return null;
    const total = employees.length;
    const avgPulse = Math.round(employees.reduce((s, e) => s + e.pulse_score, 0) / total);
    const avgRisk = Math.round(employees.reduce((s, e) => s + e.estimated_attrition_risk, 0) / total);
    const highRisk = employees.filter((e) => e.estimated_attrition_risk >= 61).length;
    const departments = new Set(employees.map((e) => e.department)).size;
    const responding = employees.length;
    return { total, avgPulse, avgRisk, highRisk, departments, responding };
  }, [employees]);

  const pulseByDept = useMemo(
    () => summaries.map((s) => ({ department: s.department, pulse: s.avg_pulse, risk: s.avg_risk })),
    [summaries]
  );

  const workloadByDept = useMemo(
    () => summaries.map((s) => ({
      department: s.department,
      High: s.high_risk_count,
      Medium: s.medium_risk_count,
      Low: s.low_risk_count,
    })),
    [summaries]
  );

  const recognitionData = useMemo(
    () => summaries.map((s) => ({ department: s.department, score: Math.round((s.avg_recognition / 5) * 100) })),
    [summaries]
  );

  const careerData = useMemo(
    () => summaries.map((s) => ({ department: s.department, score: Math.round((s.avg_career_growth / 5) * 100) })),
    [summaries]
  );

  const satisfactionTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const baseAvg = kpis?.avgPulse ?? 50;
    return months.map((m, i) => ({
      month: m,
      satisfaction: Math.max(20, Math.min(90, baseAvg + Math.round(Math.sin(i * 0.7) * 8) + (i - 5) * 2)),
    }));
  }, [kpis]);

  const handleGenerateInsight = async () => {
    setInsightLoading(true);
    try {
      const result = await generateWorkforceInsight(summaries);
      setInsight(result);
    } catch {
      setError('Failed to generate AI insight.');
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading workforce data..." />;
  if (error) return <ErrorState message={error} />;
  if (!kpis) return <ErrorState message="No data available." />;

  const riskColor = kpis.avgRisk >= 61 ? '#ef4444' : kpis.avgRisk >= 31 ? '#f59e0b' : '#10b981';

  return (
    <div className="space-y-6">
      <SectionHeader
        title="HR Dashboard"
        subtitle="Workforce health overview across all departments"
        icon={<LayoutDashboard className="w-5 h-5" />}
      />

      {/* KPI Cards — primary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Employees" value={kpis.total} icon={<Users className="w-5 h-5" />} accent="navy" />
        <KpiCard
          label="Pulse Score"
          value={kpis.avgPulse}
          icon={<HeartPulse className="w-5 h-5" />}
          accent="blue"
          trend={kpis.avgPulse >= 80 ? 'Healthy' : kpis.avgPulse >= 50 ? 'Needs Attention' : 'Critical'}
          trendColor={kpis.avgPulse >= 80 ? 'text-emerald-600' : kpis.avgPulse >= 50 ? 'text-amber-600' : 'text-red-600'}
          trendDirection={kpis.avgPulse >= 80 ? 'up' : 'down'}
          progress={kpis.avgPulse}
        />
        <KpiCard
          label="Avg Attrition Risk"
          value={`${kpis.avgRisk}%`}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="amber"
          trend={kpis.avgRisk >= 61 ? 'High' : kpis.avgRisk >= 31 ? 'Medium' : 'Low'}
          trendColor={kpis.avgRisk >= 61 ? 'text-red-600' : kpis.avgRisk >= 31 ? 'text-amber-600' : 'text-emerald-600'}
          trendDirection={kpis.avgRisk >= 61 ? 'up' : 'down'}
          progress={kpis.avgRisk}
        />
        <KpiCard
          label="High Risk Employees"
          value={kpis.highRisk}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="red"
          trend={`${Math.round((kpis.highRisk / kpis.total) * 100)}% of workforce`}
          trendColor="text-red-600"
          trendDirection="up"
        />
      </div>

      {/* KPI Cards — secondary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Departments" value={kpis.departments} icon={<Building2 className="w-5 h-5" />} accent="navy" />
        <KpiCard label="Employees Responding" value={kpis.responding} icon={<MessageSquare className="w-5 h-5" />} accent="emerald" trend="100% response rate" trendColor="text-emerald-600" trendDirection="up" />
        <div className="card col-span-2 flex items-center justify-between">
          <div>
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Risk Distribution</p>
            <div className="flex items-center gap-4 mt-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-sm font-bold text-navy-900">{kpis.highRisk}</span>
                <span className="text-xs text-slate-400">High</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm font-bold text-navy-900">{employees.filter((e) => e.estimated_attrition_risk >= 31 && e.estimated_attrition_risk < 61).length}</span>
                <span className="text-xs text-slate-400">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-navy-900">{employees.filter((e) => e.estimated_attrition_risk < 31).length}</span>
                <span className="text-xs text-slate-400">Low</span>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex h-2 w-32 rounded-full overflow-hidden">
              <div className="bg-red-500" style={{ width: `${(kpis.highRisk / kpis.total) * 100}%` }} />
              <div className="bg-amber-500" style={{ width: `${(employees.filter((e) => e.estimated_attrition_risk >= 31 && e.estimated_attrition_risk < 61).length / kpis.total) * 100}%` }} />
              <div className="bg-emerald-500" style={{ width: `${(employees.filter((e) => e.estimated_attrition_risk < 31).length / kpis.total) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Employee Pulse by Department" subtitle="Average pulse score (0–100) per department">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pulseByDept} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="department" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="pulse" radius={[6, 6, 0, 0]} name="Pulse Score" maxBarSize={48}>
                {pulseByDept.map((entry, i) => (
                  <Cell key={i} fill={entry.pulse >= 70 ? '#10b981' : entry.pulse >= 40 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attrition Risk by Department" subtitle="Estimated risk percentage (higher = more risk)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pulseByDept} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="department" tick={{ ...CHART_AXIS_TICK, fill: '#475569' }} width={80} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="risk" radius={[0, 6, 6, 0]} name="Estimated Risk %" maxBarSize={28}>
                {pulseByDept.map((entry, i) => (
                  <Cell key={i} fill={entry.risk >= 61 ? '#ef4444' : entry.risk >= 31 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <ChartCard title="Workload Distribution" subtitle="Risk-level breakdown by department">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={workloadByDept} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="department" tick={{ ...CHART_AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="High" stackId="a" fill="#ef4444" />
              <Bar dataKey="Medium" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Low" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Recognition Score" subtitle="Employee recognition by department (0–100%)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={recognitionData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="department" tick={{ ...CHART_AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Recognition %" maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Career Growth Score" subtitle="Career growth perception (0–100%)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={careerData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="department" tick={{ ...CHART_AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="score" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Career Growth %" maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Satisfaction trend — full width */}
      <ChartCard title="Employee Satisfaction Trend" subtitle="Monthly aggregated satisfaction score across the organization">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={satisfactionTrend} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="satGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3366ff" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3366ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ stroke: '#3366ff', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="satisfaction" stroke="#3366ff" strokeWidth={2.5} fill="url(#satGradient)" name="Satisfaction" dot={{ r: 3, fill: '#3366ff', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* AI Workforce Insight */}
      <div className="card bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white border-navy-800 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base tracking-tight-2">AI Workforce Insight</h3>
                <p className="text-xs text-navy-300 mt-0.5">AI-generated summary of workforce health</p>
              </div>
            </div>
            <button
              onClick={handleGenerateInsight}
              disabled={insightLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 transition-all text-sm font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 active:scale-[0.98]"
            >
              {insightLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {insightLoading ? 'Generating...' : 'Generate AI Insights'}
            </button>
          </div>
          {insight ? (
            <div className="space-y-3 animate-fade-in">
              <p className="text-navy-100 leading-relaxed text-[0.95rem]">{insight.summary}</p>
              {insight.topFactors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {insight.topFactors.map((f) => (
                    <span key={f} className="inline-flex items-center px-3 py-1 rounded-lg bg-brand-500/15 text-brand-200 text-xs font-semibold border border-brand-500/20">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-navy-400 text-sm">
              Click "Generate AI Insights" to get an AI-powered summary of your workforce's current risk landscape.
            </p>
          )}
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
