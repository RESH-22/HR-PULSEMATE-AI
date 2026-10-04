import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FlaskConical, ArrowRight, ArrowDown, ArrowUp, Save, Sparkles, Loader2, Sliders,
} from 'lucide-react';
import { SectionHeader, LoadingSpinner, ErrorState, Disclaimer, ChartCard, CHART_TOOLTIP_STYLE, CHART_AXIS_TICK } from './ui';
import { fetchAllEmployees, computeDepartmentSummaries, getDepartmentAverages } from '@/lib/dataAccess';
import { simulateIntervention, getWorkloadLabel } from '@/lib/riskEngine';
import { generateSimulationRecommendation } from '@/lib/aiService';
import { supabase } from '@/lib/supabase';
import type { EmployeePulse } from '@/types';
import { DEPARTMENTS } from '@/types';

interface SliderConfig {
  key: string;
  label: string;
  description: string;
  min: number;
  max: number;
}

const SLIDERS: SliderConfig[] = [
  { key: 'workload', label: 'Reduce Workload', description: 'Redistribute tasks and reduce pressure', min: 0, max: 3 },
  { key: 'recognition', label: 'Increase Recognition', description: 'Introduce recognition programs', min: 0, max: 3 },
  { key: 'career_growth', label: 'Increase Career Development', description: 'Career paths and promotions', min: 0, max: 3 },
  { key: 'manager_support', label: 'Improve Manager Support', description: 'Manager training and coaching', min: 0, max: 3 },
  { key: 'work_life_balance', label: 'Improve Work-Life Balance', description: 'Flexible hours and time off', min: 0, max: 3 },
  { key: 'training', label: 'Increase Employee Training', description: 'Skills training and certifications', min: 0, max: 3 },
];

export function WhatIfSimulator() {
  const [employees, setEmployees] = useState<EmployeePulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>('Sales');
  const [adjustments, setAdjustments] = useState<Record<string, number>>({
    workload: 0, recognition: 0, career_growth: 0, manager_support: 0, work_life_balance: 0, training: 0,
  });
  const [scenarioName, setScenarioName] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [aiRec, setAiRec] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

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

  const currentFactors = useMemo(() => {
    if (!selectedSummary) return null;
    return getDepartmentAverages(selectedSummary);
  }, [selectedSummary]);

  const simulation = useMemo(() => {
    if (!currentFactors) return null;
    return simulateIntervention(currentFactors, adjustments);
  }, [currentFactors, adjustments]);

  const pulseDelta = simulation ? simulation.simulatedPulse - (selectedSummary?.avg_pulse ?? 0) : 0;
  const riskDelta = simulation ? simulation.simulatedRisk - (selectedSummary?.avg_risk ?? 0) : 0;

  const comparisonData = useMemo(() => {
    if (!simulation || !selectedSummary) return [];
    return [
      { metric: 'Pulse Score', Current: selectedSummary.avg_pulse, Simulated: simulation.simulatedPulse },
      { metric: 'Attrition Risk', Current: selectedSummary.avg_risk, Simulated: simulation.simulatedRisk },
      { metric: 'Satisfaction', Current: Math.round((selectedSummary.avg_job_satisfaction / 5) * 100), Simulated: simulation.simulatedSatisfaction },
    ];
  }, [simulation, selectedSummary]);

  const activeInterventions = useMemo(() => {
    return SLIDERS.filter((s) => adjustments[s.key] > 0).map((s) => s.label);
  }, [adjustments]);

  const handleSlider = (key: string, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
    setAiRec(null);
  };

  const handleSave = async () => {
    if (!simulation || !selectedSummary) return;
    const name = scenarioName.trim() || `Scenario ${new Date().toLocaleTimeString()}`;
    setSaveStatus('saving');
    try {
      const { error: insertError } = await supabase.from('scenarios').insert({
        name,
        department: selectedDept,
        workload_adjustment: adjustments.workload,
        recognition_adjustment: adjustments.recognition,
        career_growth_adjustment: adjustments.career_growth,
        manager_support_adjustment: adjustments.manager_support,
        work_life_balance_adjustment: adjustments.work_life_balance,
        training_adjustment: adjustments.training,
        simulated_pulse_score: simulation.simulatedPulse,
        simulated_attrition_risk: simulation.simulatedRisk,
        simulated_workload_label: simulation.simulatedWorkloadLabel,
        simulated_satisfaction: simulation.simulatedSatisfaction,
      });
      if (insertError) throw insertError;
      setSaveStatus('saved');
      setScenarioName('');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleAiRecommendation = async () => {
    if (activeInterventions.length === 0) return;
    setAiLoading(true);
    try {
      const rec = await generateSimulationRecommendation(activeInterventions, pulseDelta, riskDelta);
      setAiRec(rec);
    } catch {
      setAiRec('Unable to generate recommendation at this time.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading simulator data..." />;
  if (error) return <ErrorState message={error} />;
  if (!selectedSummary || !simulation) return <ErrorState message="No data available." />;

  const currentWorkloadLabel = getWorkloadLabel(6 - selectedSummary.avg_workload);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="What-If HR Simulator"
        subtitle="Test potential HR interventions before implementing them"
        icon={<FlaskConical className="w-5 h-5" />}
      />

      {/* Department selector */}
      <div className="card">
        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-3">Select Department</label>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((d) => (
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
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Sliders */}
        <div className="card">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center ring-1 ring-brand-100">
              <Sliders className="w-4 h-4 text-brand-600" />
            </div>
            <h3 className="font-bold text-navy-900 tracking-tight-2">Intervention Controls</h3>
          </div>
          <div className="space-y-5">
            {SLIDERS.map((slider) => (
              <div key={slider.key}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-navy-800">{slider.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{slider.description}</p>
                  </div>
                  <span className={`text-sm font-extrabold tabular-nums ${adjustments[slider.key] > 0 ? 'text-brand-600' : 'text-slate-300'}`}>
                    +{adjustments[slider.key]}
                  </span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  value={adjustments[slider.key]}
                  onChange={(e) => handleSlider(slider.key, parseInt(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* Save scenario */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">Save this scenario for comparison</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g. Reduce workload + recognition"
                className="input-base"
              />
              <button onClick={handleSave} disabled={saveStatus === 'saving'} className="btn-primary text-sm flex-shrink-0">
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
            {saveStatus === 'saved' && <p className="text-xs text-emerald-600 mt-2 font-medium animate-fade">Scenario saved! View it in Scenario Comparison.</p>}
            {saveStatus === 'error' && <p className="text-xs text-red-600 mt-2 font-medium animate-fade">Failed to save. Please try again.</p>}
          </div>
        </div>

        {/* Right: Current vs Simulated */}
        <div className="space-y-4">
          {/* Current state */}
          <div className="card bg-slate-50/80 border-slate-100">
            <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-4">Current State</h4>
            <div className="space-y-3">
              <StateRow label="Pulse Score" value={`${selectedSummary.avg_pulse}`} unit="" />
              <StateRow label="Estimated Attrition Risk" value={`${selectedSummary.avg_risk}`} unit="%" />
              <StateRow label="Workload" value={currentWorkloadLabel} unit="" />
            </div>
          </div>

          {/* Simulated state */}
          <div className="card bg-gradient-to-br from-brand-50/80 to-white border-brand-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-2xs font-bold uppercase tracking-wider text-brand-700">Simulated State</h4>
              {activeInterventions.length > 0 && (
                <span className="badge bg-brand-100 text-brand-700">{activeInterventions.length} active</span>
              )}
            </div>
            <div className="space-y-4">
              <SimulatedRow label="Pulse Score" current={selectedSummary.avg_pulse} simulated={simulation.simulatedPulse} unit="" invertGood />
              <SimulatedRow label="Attrition Risk" current={selectedSummary.avg_risk} simulated={simulation.simulatedRisk} unit="%" />
              <SimulatedRow label="Workload" current={currentWorkloadLabel} simulated={simulation.simulatedWorkloadLabel} unit="" isText />
              <SimulatedRow label="Satisfaction" current={Math.round((selectedSummary.avg_job_satisfaction / 5) * 100)} simulated={simulation.simulatedSatisfaction} unit="%" invertGood />
            </div>
          </div>
        </div>
      </div>

      {/* Comparison chart */}
      <ChartCard title="Current vs Simulated Comparison" subtitle="Side-by-side comparison of key workforce metrics">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={comparisonData} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="metric" tick={{ ...CHART_AXIS_TICK, fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="Current" fill="#cbd5e1" radius={[6, 6, 0, 0]} maxBarSize={56} />
            <Bar dataKey="Simulated" fill="#3366ff" radius={[6, 6, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* AI Recommendation */}
      <div className="card bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white border-navy-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base tracking-tight-2">AI Recommendation</h3>
                <p className="text-xs text-navy-300 mt-0.5">AI assessment of this simulation</p>
              </div>
            </div>
            <button
              onClick={handleAiRecommendation}
              disabled={aiLoading || activeInterventions.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 transition-all text-sm font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 active:scale-[0.98]"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? 'Analyzing...' : 'Get AI Recommendation'}
            </button>
          </div>
          {aiRec ? (
            <p className="text-navy-100 leading-relaxed text-[0.95rem] animate-fade-in">{aiRec}</p>
          ) : (
            <p className="text-navy-400 text-sm leading-relaxed">
              {activeInterventions.length === 0
                ? 'Adjust the sliders above to simulate interventions, then generate an AI recommendation.'
                : 'Click "Get AI Recommendation" for an AI assessment of your simulated interventions.'}
            </p>
          )}
        </div>
      </div>

      <Disclaimer text="Simulation results are estimates based on a prototype scoring formula, not guaranteed outcomes. Actual results will vary based on real-world implementation and organizational context." />
    </div>
  );
}

function StateRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-lg font-extrabold text-navy-900 tabular-nums">{value}{unit}</span>
    </div>
  );
}

function SimulatedRow({
  label, current, simulated, unit, invertGood, isText,
}: {
  label: string;
  current: number | string;
  simulated: number | string;
  unit: string;
  invertGood?: boolean;
  isText?: boolean;
}) {
  const numericCurrent = typeof current === 'number' ? current : 0;
  const numericSimulated = typeof simulated === 'number' ? simulated : 0;
  const delta = numericSimulated - numericCurrent;
  const isImprovement = invertGood ? delta > 0 : delta < 0;
  const isNeutral = delta === 0;

  if (isText) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{current}</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-lg font-extrabold text-navy-900">{simulated}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 tabular-nums">{current}{unit}</span>
        <ArrowRight className="w-3 h-3 text-slate-400" />
        <span className="text-lg font-extrabold text-navy-900 tabular-nums">{simulated}{unit}</span>
        {!isNeutral && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md ${
            isImprovement ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {invertGood ? (delta > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : (delta < 0 ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
            {Math.abs(delta)}{unit === '%' ? 'pt' : unit === '' ? 'pt' : unit}
          </span>
        )}
      </div>
    </div>
  );
}
