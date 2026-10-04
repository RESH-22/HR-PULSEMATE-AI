import { useState, useEffect, useMemo } from 'react';
import { Brain, Loader2, Lightbulb, Target, Zap, TrendingUp, GraduationCap } from 'lucide-react';
import { SectionHeader, LoadingSpinner, ErrorState, Disclaimer, RiskBadge, EmptyState } from './ui';
import { fetchAllEmployees, computeDepartmentSummaries } from '@/lib/dataAccess';
import { generateDepartmentInsight } from '@/lib/aiService';
import type { AIInsight } from '@/lib/aiService';
import type { EmployeePulse } from '@/types';
import { DEPARTMENTS } from '@/types';

export function AIWorkmate() {
  const [employees, setEmployees] = useState<EmployeePulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>('Sales');
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

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

  const handleGenerate = async () => {
    if (!selectedSummary) return;
    setInsightLoading(true);
    setInsight(null);
    try {
      const result = await generateDepartmentInsight(selectedSummary);
      setInsight(result);
    } catch {
      setError('Failed to generate AI recommendations.');
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading workforce data..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI HR Workmate"
        subtitle="AI-generated decision support for HR interventions — not employment decisions"
        icon={<Brain className="w-5 h-5" />}
      />

      {/* Department selector */}
      <div className="card">
        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-3">Select Department to Analyze</label>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((d) => (
            <button
              key={d}
              onClick={() => { setSelectedDept(d); setInsight(null); }}
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

      {selectedSummary && (
        <>
          {/* Summary bar */}
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="card py-4">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Department</p>
              <p className="text-lg font-extrabold text-navy-900 mt-1.5 tracking-tight-2">{selectedSummary.department}</p>
            </div>
            <div className="card py-4">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Avg Pulse Score</p>
              <p className="text-lg font-extrabold text-navy-900 mt-1.5">{selectedSummary.avg_pulse}<span className="text-sm text-slate-400 font-bold">/100</span></p>
            </div>
            <div className="card py-4">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Estimated Risk</p>
              <p className="text-lg font-extrabold text-navy-900 mt-1.5">{selectedSummary.avg_risk}%</p>
            </div>
            <div className="card py-4">
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Risk Level</p>
              <div className="mt-2"><RiskBadge risk={selectedSummary.avg_risk} /></div>
            </div>
          </div>

          {/* Generate button */}
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={insightLoading}
              className="btn-primary-lg"
            >
              {insightLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
              {insightLoading ? 'AI is analyzing...' : 'Generate AI Recommendations'}
            </button>
          </div>

          {/* AI Insight Results */}
          {insight && (
            <div className="space-y-4 animate-fade-in">
              {/* Main concern */}
              <div className="card border-l-[3px] border-l-amber-500">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 ring-1 ring-amber-100">
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400">Main Workplace Concern</h4>
                    <p className="text-lg font-bold text-navy-900 mt-1 tracking-tight-2">{insight.concern}</p>
                  </div>
                </div>
              </div>

              {/* Contributing reasons */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-brand-600" />
                  <h4 className="font-bold text-navy-900 tracking-tight-2">Possible Contributing Reasons</h4>
                </div>
                <ul className="space-y-3">
                  {insight.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                      <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-px ring-1 ring-brand-100">
                        {i + 1}
                      </span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Immediate action */}
              <div className="card border-l-[3px] border-l-red-500">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 ring-1 ring-red-100">
                    <Zap className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400">Immediate HR Action</h4>
                    <p className="text-sm text-navy-800 mt-1.5 leading-relaxed">{insight.immediateAction}</p>
                  </div>
                </div>
              </div>

              {/* Medium-term action */}
              <div className="card border-l-[3px] border-l-brand-500">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 ring-1 ring-brand-100">
                    <TrendingUp className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400">Medium-Term HR Action</h4>
                    <p className="text-sm text-navy-800 mt-1.5 leading-relaxed">{insight.mediumTermAction}</p>
                  </div>
                </div>
              </div>

              {/* Development recommendation */}
              <div className="card border-l-[3px] border-l-emerald-500">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 ring-1 ring-emerald-100">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400">Employee Development Recommendation</h4>
                    <p className="text-sm text-navy-800 mt-1.5 leading-relaxed">{insight.developmentRecommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!insight && !insightLoading && (
            <EmptyState
              icon={<Brain className="w-8 h-8" />}
              title="Ready for AI Analysis"
              description={`Click "Generate AI Recommendations" to get structured decision support for the ${selectedDept} department.`}
            />
          )}
        </>
      )}

      <Disclaimer text="AI recommendations provide decision support only. They do not make employment decisions and should be reviewed by HR professionals before implementation." />
    </div>
  );
}
