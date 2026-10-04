import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Trophy, Trash2, RefreshCw, GitCompare } from 'lucide-react';
import { SectionHeader, LoadingSpinner, ErrorState, Disclaimer, EmptyState, ChartCard, CHART_TOOLTIP_STYLE, CHART_AXIS_TICK } from './ui';
import { supabase } from '@/lib/supabase';
import type { Scenario } from '@/types';

export function ScenarioComparison() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('scenarios')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setScenarios((data as Scenario[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScenarios(); }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from('scenarios').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to delete scenario');
    }
  };

  const bestScenario = useMemo(() => {
    if (scenarios.length === 0) return null;
    return scenarios.reduce((best, s) =>
      s.simulated_attrition_risk < best.simulated_attrition_risk ? s : best
    );
  }, [scenarios]);

  const chartData = useMemo(() => {
    return scenarios.map((s) => ({
      name: s.name.length > 20 ? s.name.slice(0, 20) + '...' : s.name,
      fullName: s.name,
      'Pulse Score': s.simulated_pulse_score,
      'Attrition Risk': s.simulated_attrition_risk,
      Satisfaction: s.simulated_satisfaction,
    }));
  }, [scenarios]);

  if (loading) return <LoadingSpinner label="Loading saved scenarios..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Scenario Comparison"
        subtitle="Compare saved what-if scenarios to identify the best intervention strategy"
        icon={<GitCompare className="w-5 h-5" />}
        action={
          <button onClick={fetchScenarios} className="btn-secondary text-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
      />

      {scenarios.length === 0 ? (
        <EmptyState
          icon={<GitCompare className="w-8 h-8" />}
          title="No saved scenarios yet"
          description="Go to the What-If Simulator, adjust the intervention sliders, and save scenarios. They will appear here for side-by-side comparison."
        />
      ) : (
        <>
          {/* Best scenario banner */}
          {bestScenario && (
            <div className="card bg-gradient-to-r from-emerald-50/80 to-white border-emerald-200/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none" />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 ring-1 ring-emerald-200/60">
                  <Trophy className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-navy-900 tracking-tight-2">Best-Performing Scenario</h3>
                  <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                    <span className="font-bold">{bestScenario.name}</span> —
                    Estimated attrition risk: {bestScenario.simulated_attrition_risk}%,
                    Pulse: {bestScenario.simulated_pulse_score},
                    Satisfaction: {bestScenario.simulated_satisfaction}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comparison chart */}
          <ChartCard title="Scenario Comparison Chart" subtitle="Key metrics across all saved scenarios">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ ...CHART_AXIS_TICK, fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={70} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  cursor={{ fill: '#f8fafc' }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                <Bar dataKey="Pulse Score" fill="#3366ff" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Attrition Risk" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Satisfaction" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Scenario cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((s) => {
              const isBest = bestScenario?.id === s.id;
              return (
                <div key={s.id} className={`card card-hover ${isBest ? 'ring-2 ring-emerald-400 border-emerald-200/60' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-navy-900 truncate tracking-tight-2">{s.name}</h4>
                        {isBest && <Trophy className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      </div>
                      {s.department && <p className="text-xs text-slate-400 mt-0.5 font-medium">{s.department}</p>}
                    </div>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      aria-label="Delete scenario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Pulse Score</span>
                      <span className="font-extrabold text-navy-900 tabular-nums">{s.simulated_pulse_score}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Attrition Risk</span>
                      <span className="font-extrabold text-navy-900 tabular-nums">{s.simulated_attrition_risk}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Workload</span>
                      <span className="font-semibold text-navy-700">{s.simulated_workload_label}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Satisfaction</span>
                      <span className="font-extrabold text-navy-900 tabular-nums">{s.simulated_satisfaction}%</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">Interventions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {s.workload_adjustment > 0 && <span className="badge bg-red-50 text-red-600 ring-1 ring-inset ring-red-200/50">Workload +{s.workload_adjustment}</span>}
                      {s.recognition_adjustment > 0 && <span className="badge bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-200/50">Recognition +{s.recognition_adjustment}</span>}
                      {s.career_growth_adjustment > 0 && <span className="badge bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-200/50">Career +{s.career_growth_adjustment}</span>}
                      {s.manager_support_adjustment > 0 && <span className="badge bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200/50">Manager +{s.manager_support_adjustment}</span>}
                      {s.work_life_balance_adjustment > 0 && <span className="badge bg-cyan-50 text-cyan-600 ring-1 ring-inset ring-cyan-200/50">WLB +{s.work_life_balance_adjustment}</span>}
                      {s.training_adjustment > 0 && <span className="badge bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200/50">Training +{s.training_adjustment}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Disclaimer text="Simulated outcomes are estimates, not guarantees. Compare scenarios as relative indicators, not exact predictions." />
    </div>
  );
}
