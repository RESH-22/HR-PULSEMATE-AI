import { HeartPulse, ArrowRight, TrendingDown, Brain, FlaskConical, ShieldCheck, BarChart3, GitBranch, Sparkles } from 'lucide-react';
import type { Page } from './Layout';

interface LandingProps {
  onNavigate: (page: Page) => void;
}

export function Landing({ onNavigate }: LandingProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-navy-900 text-base tracking-tight-2">HR PulseMate AI</span>
          </div>
          <button onClick={() => onNavigate('dashboard')} className="btn-primary text-sm">
            Explore Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 via-white to-white pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-50/40 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 lg:px-8 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            Future of Work & Automation
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold text-navy-900 leading-[1.1] tracking-tight-3 animate-fade-in">
            HR PulseMate AI
          </h1>
          <p className="text-lg lg:text-xl text-brand-600 font-semibold mt-4 tracking-tight-2 animate-fade-in">
            Detect. Understand. Act. Before Employees Leave.
          </p>
          <p className="text-base lg:text-lg text-slate-600 max-w-2xl mx-auto mt-6 leading-relaxed animate-fade-in">
            An AI-powered workforce intelligence platform that detects employee disengagement,
            identifies workplace risk factors, recommends HR interventions, and simulates
            potential outcomes — before they become resignations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 animate-fade-in">
            <button onClick={() => onNavigate('dashboard')} className="btn-primary-lg">
              Explore HR Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => onNavigate('pulse')} className="btn-secondary-lg">
              Take Employee Pulse
            </button>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<TrendingDown className="w-6 h-6" />}
            title="Predict"
            description="Detect early workforce risk signals across departments using pulse scores and estimated attrition risk."
            color="bg-brand-50 text-brand-600 ring-brand-100"
          />
          <FeatureCard
            icon={<GitBranch className="w-6 h-6" />}
            title="Understand"
            description="Identify the factors behind employee disengagement — workload, recognition, career growth, and more."
            color="bg-violet-50 text-violet-600 ring-violet-100"
          />
          <FeatureCard
            icon={<FlaskConical className="w-6 h-6" />}
            title="Act"
            description="Simulate HR interventions before implementing them. Compare scenarios and choose the best path forward."
            color="bg-emerald-50 text-emerald-600 ring-emerald-100"
          />
        </div>
      </section>

      {/* Module showcase */}
      <section className="bg-navy-950 text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-center mb-12 tracking-tight-2">A complete HR intelligence suite</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModuleCard icon={<BarChart3 className="w-5 h-5" />} title="HR Dashboard" desc="KPIs, trends, and workforce health at a glance" onClick={() => onNavigate('dashboard')} />
            <ModuleCard icon={<HeartPulse className="w-5 h-5" />} title="Employee Pulse" desc="Anonymous 7-question survey with instant scoring" onClick={() => onNavigate('pulse')} />
            <ModuleCard icon={<TrendingDown className="w-5 h-5" />} title="Attrition Risk Monitor" desc="Estimated risk by team with filtering" onClick={() => onNavigate('risk')} />
            <ModuleCard icon={<GitBranch className="w-5 h-5" />} title="Root Cause Analysis" desc="Visual breakdown of contributing factors" onClick={() => onNavigate('rootcause')} />
            <ModuleCard icon={<Brain className="w-5 h-5" />} title="AI HR Workmate" desc="AI-generated recommendations and action plans" onClick={() => onNavigate('aiworkmate')} />
            <ModuleCard icon={<FlaskConical className="w-5 h-5" />} title="What-If Simulator" desc="Test interventions with interactive sliders" onClick={() => onNavigate('simulator')} />
            <ModuleCard icon={<ShieldCheck className="w-5 h-5" />} title="Scenario Comparison" desc="Save and compare multiple what-if scenarios" onClick={() => onNavigate('comparison')} />
            <ModuleCard icon={<BarChart3 className="w-5 h-5" />} title="Insights & Reports" desc="Downloadable HR insights summary" onClick={() => onNavigate('reports')} />
          </div>
        </div>
      </section>

      {/* Privacy section */}
      <section className="max-w-4xl mx-auto px-4 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center gap-2 text-emerald-600 mb-4">
          <ShieldCheck className="w-6 h-6" />
          <span className="font-semibold">Privacy-first by design</span>
        </div>
        <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto">
          No employee names are collected or displayed. The Employee Pulse survey is fully anonymous.
          All risk scores are estimates — this system provides decision support and never makes
          hiring, firing, or promotion decisions. This demo uses synthetic data.
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 lg:px-8 pb-20">
        <div className="card text-center py-12 bg-gradient-to-br from-brand-50 to-white border-brand-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight-2">Ready to see your workforce pulse?</h2>
            <p className="text-slate-600 mt-3 mb-6">Explore the dashboard with pre-populated synthetic data.</p>
            <button onClick={() => onNavigate('dashboard')} className="btn-primary-lg">
              Explore HR Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <div className="card card-hover text-center">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${color} ring-1 transition-transform duration-200 hover:scale-105`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-navy-900 mb-2 tracking-tight-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function ModuleCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 group backdrop-blur-sm"
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-sm">
          {icon}
        </div>
        <span className="font-semibold text-white text-sm tracking-tight-2">{title}</span>
      </div>
      <p className="text-xs text-navy-300 leading-relaxed">{desc}</p>
      <span className="inline-flex items-center gap-1 text-2xs font-semibold text-brand-300 mt-3 group-hover:text-brand-200 transition-colors uppercase tracking-wider">
        Open <ArrowRight className="w-3 h-3" />
      </span>
    </button>
  );
}
