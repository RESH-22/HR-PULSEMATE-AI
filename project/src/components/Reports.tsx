import { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Loader2, Sparkles } from 'lucide-react';
import { SectionHeader, LoadingSpinner, ErrorState, Disclaimer, RiskBadge } from './ui';
import { fetchAllEmployees, computeDepartmentSummaries } from '@/lib/dataAccess';
import { generateWorkforceInsight, generateDepartmentInsight } from '@/lib/aiService';
import type { AIWorkforceInsight, AIInsight } from '@/lib/aiService';
import type { EmployeePulse } from '@/types';

export function Reports() {
  const [employees, setEmployees] = useState<EmployeePulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [workforceInsight, setWorkforceInsight] = useState<AIWorkforceInsight | null>(null);
  const [deptInsights, setDeptInsights] = useState<Record<string, AIInsight>>({});
  const [reportGenerated, setReportGenerated] = useState(false);

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
    return { total, avgPulse, avgRisk, highRisk };
  }, [employees]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const wfInsight = await generateWorkforceInsight(summaries);
      setWorkforceInsight(wfInsight);
      const insights: Record<string, AIInsight> = {};
      for (const summary of summaries) {
        const insight = await generateDepartmentInsight(summary);
        insights[summary.department] = insight;
      }
      setDeptInsights(insights);
      setReportGenerated(true);
    } catch {
      setError('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const lines: string[] = [];
    lines.push('HR PulseMate AI — HR Insights Report');
    lines.push('Generated: ' + new Date().toLocaleString());
    lines.push('='.repeat(60));
    lines.push('');
    lines.push('NOTE: This report uses synthetic data. All risk scores are estimates.');
    lines.push('');
    lines.push('1. OVERALL WORKFORCE HEALTH');
    lines.push('-'.repeat(40));
    if (kpis) {
      lines.push(`Total Employees: ${kpis.total}`);
      lines.push(`Average Pulse Score: ${kpis.avgPulse}/100`);
      lines.push(`Average Estimated Attrition Risk: ${kpis.avgRisk}%`);
      lines.push(`High-Risk Employees: ${kpis.highRisk} (${Math.round((kpis.highRisk / kpis.total) * 100)}%)`);
    }
    lines.push('');
    lines.push('2. HIGH-RISK DEPARTMENTS');
    lines.push('-'.repeat(40));
    for (const s of summaries) {
      lines.push(`  ${s.department}: Risk ${s.avg_risk}% | Pulse ${s.avg_pulse} | High-risk: ${s.high_risk_count}/${s.total}`);
    }
    lines.push('');
    lines.push('3. AI WORKFORCE INSIGHT');
    lines.push('-'.repeat(40));
    if (workforceInsight) {
      lines.push(`  ${workforceInsight.summary}`);
      lines.push(`  Top factors: ${workforceInsight.topFactors.join(', ')}`);
    }
    lines.push('');
    lines.push('4. DEPARTMENT RECOMMENDATIONS');
    lines.push('-'.repeat(40));
    for (const s of summaries) {
      const insight = deptInsights[s.department];
      lines.push(`  ${s.department}:`);
      if (insight) {
        lines.push(`    Concern: ${insight.concern}`);
        lines.push(`    Immediate Action: ${insight.immediateAction}`);
        lines.push(`    Medium-Term Action: ${insight.mediumTermAction}`);
        lines.push(`    Development: ${insight.developmentRecommendation}`);
      }
      lines.push('');
    }
    lines.push('5. WHAT-IF SIMULATION SUMMARY');
    lines.push('-'.repeat(40));
    lines.push('  Use the What-If Simulator to test interventions and save scenarios.');
    lines.push('  Saved scenarios can be compared in the Scenario Comparison page.');
    lines.push('');
    lines.push('='.repeat(60));
    lines.push('End of Report');
    lines.push('This is a decision-support tool. Estimates are not predictions of');
    lines.push('individual employee behavior. No employment decisions are made by this system.');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr-pulsemate-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner label="Loading report data..." />;
  if (error) return <ErrorState message={error} />;
  if (!kpis) return <ErrorState message="No data available." />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Insights & Reports"
        subtitle="Generate a comprehensive HR insights report with AI recommendations"
        icon={<FileText className="w-5 h-5" />}
        action={
          <div className="flex gap-2">
            <button onClick={handleGenerateReport} disabled={generating} className="btn-primary text-sm">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
            {reportGenerated && (
              <button onClick={handleDownload} className="btn-secondary text-sm">
                <Download className="w-4 h-4" />
                Download Report
              </button>
            )}
          </div>
        }
      />

      {/* Report preview */}
      <div className="card">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center ring-1 ring-brand-100">
            <FileText className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-navy-900 text-lg tracking-tight-2">HR Insights Report Preview</h3>
            <p className="text-sm text-slate-400 mt-0.5">Generated from synthetic data</p>
          </div>
        </div>

        {/* Section 1: Workforce Health */}
        <ReportSection number="1" title="Overall Workforce Health">
          <div className="grid sm:grid-cols-4 gap-4">
            <ReportMetric label="Total Employees" value={kpis.total.toString()} />
            <ReportMetric label="Avg Pulse Score" value={`${kpis.avgPulse}/100`} />
            <ReportMetric label="Avg Attrition Risk" value={`${kpis.avgRisk}%`} />
            <ReportMetric label="High-Risk" value={kpis.highRisk.toString()} />
          </div>
        </ReportSection>

        {/* Section 2: High-risk departments */}
        <ReportSection number="2" title="High-Risk Departments">
          <div className="space-y-1">
            {summaries.map((s) => (
              <div key={s.department} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-navy-900">{s.department}</span>
                  <RiskBadge risk={s.avg_risk} size="sm" />
                </div>
                <div className="flex items-center gap-5 text-sm text-slate-500">
                  <span><span className="text-slate-400">Pulse:</span> <span className="font-bold text-navy-700">{s.avg_pulse}</span></span>
                  <span><span className="text-slate-400">Risk:</span> <span className="font-bold text-navy-700">{s.avg_risk}%</span></span>
                  <span><span className="text-slate-400">High-risk:</span> <span className="font-bold text-navy-700">{s.high_risk_count}/{s.total}</span></span>
                </div>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* Section 3: AI insight */}
        <ReportSection number="3" title="AI Workforce Insight">
          {workforceInsight ? (
            <div className="animate-fade-in">
              <p className="text-sm text-navy-800 leading-relaxed">{workforceInsight.summary}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {workforceInsight.topFactors.map((f) => (
                  <span key={f} className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/50">{f}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Click "Generate Report" to produce AI insights.</p>
          )}
        </ReportSection>

        {/* Section 4: Department recommendations */}
        <ReportSection number="4" title="Department Recommendations">
          {Object.keys(deptInsights).length > 0 ? (
            <div className="space-y-3">
              {summaries.map((s) => {
                const insight = deptInsights[s.department];
                if (!insight) return null;
                return (
                  <div key={s.department} className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                    <h4 className="font-bold text-navy-900 mb-2.5 tracking-tight-2">{s.department}</h4>
                    <p className="text-sm text-slate-700 mb-1.5 leading-relaxed"><span className="font-semibold text-navy-800">Concern:</span> {insight.concern}</p>
                    <p className="text-sm text-slate-700 mb-1.5 leading-relaxed"><span className="font-semibold text-navy-800">Immediate:</span> {insight.immediateAction}</p>
                    <p className="text-sm text-slate-700 mb-1.5 leading-relaxed"><span className="font-semibold text-navy-800">Medium-term:</span> {insight.mediumTermAction}</p>
                    <p className="text-sm text-slate-700 leading-relaxed"><span className="font-semibold text-navy-800">Development:</span> {insight.developmentRecommendation}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Click "Generate Report" to produce department-level recommendations.</p>
          )}
        </ReportSection>

        {/* Section 5: Simulation results */}
        <ReportSection number="5" title="What-If Simulation Results">
          <p className="text-sm text-slate-600 leading-relaxed">
            Use the <span className="font-bold">What-If Simulator</span> to test interventions and save scenarios.
            Saved scenarios can be compared in the <span className="font-bold">Scenario Comparison</span> page.
          </p>
        </ReportSection>
      </div>

      <Disclaimer />
    </div>
  );
}

function ReportSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 last:mb-0">
      <h4 className="font-bold text-navy-900 mb-4 flex items-center gap-2.5 tracking-tight-2">
        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs flex items-center justify-center font-bold shadow-sm">{number}</span>
        {title}
      </h4>
      <div className="pl-10">{children}</div>
    </div>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
      <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xl font-extrabold text-navy-900 mt-1.5 leading-none">{value}</p>
    </div>
  );
}
