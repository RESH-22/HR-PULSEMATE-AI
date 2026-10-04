import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, HeartPulse, AlertTriangle, Brain, GitBranch,
  FlaskConical, GitCompare, FileText, Menu, X, ShieldCheck,
} from 'lucide-react';

export type Page =
  | 'landing'
  | 'dashboard'
  | 'pulse'
  | 'risk'
  | 'rootcause'
  | 'aiworkmate'
  | 'simulator'
  | 'comparison'
  | 'reports';

interface NavItem {
  id: Page;
  label: string;
  icon: typeof Home;
  group: string;
}

import { Home } from 'lucide-react';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'HR Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'pulse', label: 'Employee Pulse', icon: HeartPulse, group: 'Overview' },
  { id: 'risk', label: 'Attrition Risk', icon: AlertTriangle, group: 'Analysis' },
  { id: 'rootcause', label: 'Root Cause Analysis', icon: GitBranch, group: 'Analysis' },
  { id: 'aiworkmate', label: 'AI HR Workmate', icon: Brain, group: 'Intelligence' },
  { id: 'simulator', label: 'What-If Simulator', icon: FlaskConical, group: 'Intelligence' },
  { id: 'comparison', label: 'Scenario Comparison', icon: GitCompare, group: 'Intelligence' },
  { id: 'reports', label: 'Insights & Reports', icon: FileText, group: 'Output' },
];

interface LayoutProps {
  current: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export function Layout({ current, onNavigate, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = useCallback((page: Page) => {
    onNavigate(page);
    setSidebarOpen(false);
  }, [onNavigate]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-navy-950 text-white flex flex-col hidden lg:flex shadow-sidebar">
        <SidebarContent current={current} onNavigate={handleNavigate} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-navy-950/50 backdrop-blur-sm lg:hidden animate-fade" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-navy-950 text-white flex flex-col lg:hidden animate-fade-in">
            <SidebarContent current={current} onNavigate={handleNavigate} onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-navy-800" />
            </button>
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
                <HeartPulse className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-navy-900 text-base tracking-tight-2 hidden sm:inline">HR PulseMate AI</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="badge bg-amber-50/80 text-amber-700 ring-1 ring-inset ring-amber-200/60">
              <ShieldCheck className="w-3 h-3" />
              Synthetic Data
            </span>
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>

        <footer className="px-4 lg:px-8 py-6 text-center text-xs text-slate-400">
          HR PulseMate AI — Demo uses synthetic data. This is a decision-support tool, not a prediction of individual employee behavior.
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({ current, onNavigate, onClose }: { current: Page; onNavigate: (p: Page) => void; onClose: () => void }) {
  const groups = Array.from(new Set(NAV_ITEMS.map((n) => n.group)));

  return (
    <>
      {/* Logo */}
      <div className="px-5 h-16 flex items-center justify-between border-b border-white/5 flex-shrink-0">
        <button onClick={() => onNavigate('landing')} className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-white text-[0.95rem] leading-tight tracking-tight-2">HR PulseMate</div>
            <div className="text-2xs text-brand-300 font-semibold uppercase tracking-wider">AI Platform</div>
          </div>
        </button>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-navy-200" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {groups.map((group) => (
          <div key={group} className="mb-5">
            <p className="px-3 mb-2 text-2xs font-bold uppercase tracking-wider text-navy-400">{group}</p>
            <div className="space-y-0.5">
              {NAV_ITEMS.filter((n) => n.group === group).map((item) => {
                const Icon = item.icon;
                const isActive = current === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ease-smooth ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                        : 'text-navy-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-[1.125rem] h-[1.125rem] flex-shrink-0 transition-transform ${isActive ? '' : 'group-hover:scale-105'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 flex-shrink-0">
        <div className="p-3 rounded-xl bg-white/5">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-semibold text-navy-100">Decision Support Tool</p>
          </div>
          <p className="text-2xs text-navy-400 leading-relaxed">
            Estimated risks, not predictions. No employment decisions are made by this system.
          </p>
        </div>
      </div>
    </>
  );
}
