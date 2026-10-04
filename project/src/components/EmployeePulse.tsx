import { useState } from 'react';
import { Shield, CheckCircle2, HeartPulse, AlertCircle, ArrowRight } from 'lucide-react';
import { SectionHeader, Disclaimer } from './ui';
import { computePulseScore, estimateAttritionRisk, getPulseClassification } from '@/lib/riskEngine';
import { insertPulseResponse } from '@/lib/dataAccess';
import { DEPARTMENTS, type FactorKey } from '@/types';

interface SurveyQuestion {
  key: FactorKey;
  text: string;
}

const QUESTIONS: SurveyQuestion[] = [
  { key: 'workload', text: 'My workload is manageable.' },
  { key: 'recognition', text: 'I feel recognized for my work.' },
  { key: 'career_growth', text: 'I have opportunities for career growth.' },
  { key: 'manager_support', text: 'My manager supports me.' },
  { key: 'work_life_balance', text: 'I have a healthy work-life balance.' },
  { key: 'motivation', text: 'I feel motivated at work.' },
  { key: 'job_satisfaction', text: 'I am satisfied with my job.' },
];

const SCALE_LABELS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
const SCALE_COLORS = ['bg-red-500', 'bg-orange-400', 'bg-slate-400', 'bg-brand-400', 'bg-emerald-500'];

export function EmployeePulse() {
  const [department, setDepartment] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ pulse: number; risk: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeredAll, setAnsweredAll] = useState(false);

  const handleAnswer = (key: string, value: number) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    setAnsweredAll(Object.keys(newAnswers).length === QUESTIONS.length);
  };

  const handleSubmit = async () => {
    if (!department) { setError('Please select your department.'); return; }
    if (!answeredAll) { setError('Please answer all 7 questions.'); return; }
    setError(null);
    setSubmitting(true);

    const factors: Record<FactorKey, number> = {
      workload: answers.workload,
      recognition: answers.recognition,
      career_growth: answers.career_growth,
      manager_support: answers.manager_support,
      work_life_balance: answers.work_life_balance,
      motivation: answers.motivation,
      job_satisfaction: answers.job_satisfaction,
    };

    const pulse = computePulseScore(factors);
    const risk = estimateAttritionRisk(pulse);

    try {
      await insertPulseResponse({ department, ...factors });
    } catch {
      // Survey result still shown even if save fails
    }

    setResult({ pulse, risk });
    setSubmitting(false);
  };

  const handleReset = () => {
    setDepartment('');
    setAnswers({});
    setAnsweredAll(false);
    setResult(null);
    setError(null);
  };

  if (result) {
    const classification = getPulseClassification(result.pulse);
    const resultColor = result.pulse >= 80 ? 'emerald' : result.pulse >= 50 ? 'amber' : 'red';
    const riskColor = result.risk >= 61 ? 'red' : result.risk >= 31 ? 'amber' : 'emerald';

    return (
      <div className="space-y-6">
        <SectionHeader title="Anonymous Employee Pulse" subtitle="Your response has been recorded" icon={<HeartPulse className="w-5 h-5" />} />
        <div className="card max-w-lg mx-auto text-center animate-fade-in">
          <div className={`w-16 h-16 rounded-2xl bg-${resultColor}-50 flex items-center justify-center mx-auto mb-5 ring-1 ring-${resultColor}-100`}>
            <CheckCircle2 className={`w-8 h-8 text-${resultColor}-600`} />
          </div>
          <h2 className="text-xl font-extrabold text-navy-900 mb-2 tracking-tight-2">Response Submitted</h2>
          <p className="text-sm text-slate-500 mb-8">Your response is anonymous. No identifying information was collected.</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <HeartPulse className="w-6 h-6 text-brand-600 mx-auto mb-2" />
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Employee Pulse Score</p>
              <p className="text-3xl font-extrabold text-navy-900 mt-1 leading-none">{result.pulse}</p>
              <p className={`text-sm font-bold mt-2 ${classification.color}`}>{classification.label}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <AlertCircle className={`w-6 h-6 text-${riskColor}-600 mx-auto mb-2`} />
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Estimated Attrition Risk</p>
              <p className="text-3xl font-extrabold text-navy-900 mt-1 leading-none">{result.risk}%</p>
              <p className={`text-sm font-bold mt-2 ${result.risk >= 61 ? 'text-red-600' : result.risk >= 31 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {result.risk >= 61 ? 'High' : result.risk >= 31 ? 'Medium' : 'Low'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-50 border border-brand-100 text-left mb-6">
            <p className="text-sm text-brand-800 leading-relaxed">
              <span className="font-bold">Classification: </span>
              {classification.label} — {result.pulse >= 80 ? 'Your team is in a healthy state.' : result.pulse >= 50 ? 'There are areas that need attention.' : 'Urgent attention is recommended.'}
            </p>
          </div>

          <button onClick={handleReset} className="btn-secondary">
            Submit Another Response
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <Disclaimer text="Your pulse score is an estimate based on your survey responses. It is not a prediction of your individual employment outcomes." />
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Anonymous Employee Pulse"
        subtitle="Share your workplace experience — no name required"
        icon={<HeartPulse className="w-5 h-5" />}
      />

      <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-sm text-emerald-700 font-medium">
        <Shield className="w-4 h-4 flex-shrink-0" />
        Your response is anonymous. No identifying information is collected.
      </div>

      <div className="card max-w-3xl mx-auto space-y-6">
        {/* Department selector */}
        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-2">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input-base"
          >
            <option value="">Select your department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-brand-600 rounded-full transition-all duration-300" style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }} />
          </div>
          <span className="text-xs font-semibold text-slate-400">{answeredCount}/{QUESTIONS.length}</span>
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {QUESTIONS.map((q, idx) => (
            <div key={q.key} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
              <p className="text-sm font-medium text-navy-800 mb-3">
                <span className="text-brand-600 font-bold mr-1.5">{idx + 1}.</span>
                {q.text}
              </p>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {SCALE_LABELS.map((label, i) => {
                  const value = i + 1;
                  const selected = answers[q.key] === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleAnswer(q.key, value)}
                      className={`px-1 py-2.5 sm:px-2 sm:py-3 rounded-xl text-center transition-all duration-150 ease-smooth ${
                        selected
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 scale-[1.02]'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/80 active:scale-[0.98]'
                      }`}
                    >
                      <span className="block text-base sm:text-lg font-bold leading-none">{value}</span>
                      <span className="hidden sm:block text-2xs leading-tight mt-1 opacity-80">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200/80 text-sm text-red-600 font-medium animate-fade">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !answeredAll || !department}
          className="btn-primary w-full justify-center py-3"
        >
          {submitting ? 'Submitting...' : 'Submit Anonymous Response'}
          {!submitting && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      <Disclaimer text="After submission, your responses are aggregated with your department. Individual responses are not traceable to you." />
    </div>
  );
}
