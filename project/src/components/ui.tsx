import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendColor?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  accent?: 'blue' | 'amber' | 'red' | 'emerald' | 'navy' | 'purple';
  progress?: number;
}

const ACCENT_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  blue: { bg: 'bg-brand-50', text: 'text-brand-600', ring: 'ring-brand-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  navy: { bg: 'bg-navy-50', text: 'text-navy-600', ring: 'ring-navy-100' },
  purple: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
};

export function KpiCard({ label, value, icon, trend, trendColor, trendDirection, accent = 'blue', progress }: KpiCardProps) {
  const style = ACCENT_STYLES[accent];
  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;

  return (
    <div className="card card-hover group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-2xl lg:text-[2rem] font-extrabold text-navy-900 mt-1.5 leading-none tracking-tight-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trendDirection && (
                <TrendIcon className={`w-3 h-3 ${trendColor ?? 'text-slate-400'}`} />
              )}
              <p className={`text-xs font-semibold ${trendColor ?? 'text-slate-500'}`}>{trend}</p>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${style.bg} ${style.text} ring-1 ${style.ring} transition-transform duration-200 group-hover:scale-105 flex-shrink-0`}>
          {icon}
        </div>
      </div>
      {typeof progress === 'number' && (
        <div className="mt-3 w-full h-1 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress >= 70 ? 'bg-emerald-500' : progress >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function SectionHeader({ title, subtitle, action, icon }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl lg:text-[1.625rem] font-extrabold text-navy-900 tracking-tight-2 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

interface RiskBadgeProps {
  risk: number;
  size?: 'sm' | 'md';
}

export function RiskBadge({ risk, size = 'md' }: RiskBadgeProps) {
  const cls = size === 'sm' ? 'badge-sm' : 'badge';
  if (risk >= 61) {
    return <span className={`${cls} bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/60`}>High</span>;
  }
  if (risk >= 31) {
    return <span className={`${cls} bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60`}>Medium</span>;
  }
  return <span className={`${cls} bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60`}>Low</span>;
}

interface PulseBadgeProps {
  pulse: number;
  size?: 'sm' | 'md';
}

export function PulseBadge({ pulse, size = 'md' }: PulseBadgeProps) {
  const cls = size === 'sm' ? 'badge-sm' : 'badge';
  if (pulse >= 80) {
    return <span className={`${cls} bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60`}>Healthy</span>;
  }
  if (pulse >= 50) {
    return <span className={`${cls} bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60`}>Attention</span>;
  }
  return <span className={`${cls} bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/60`}>Critical</span>;
}

interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-[3px] border-brand-100 rounded-full" />
        <div className="absolute inset-0 border-[3px] border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
      {label && <p className="text-sm text-slate-400 mt-4 font-medium">{label}</p>}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="card text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
        <span className="w-5 h-5 rounded-full bg-red-500" />
      </div>
      <p className="text-red-600 font-semibold">{message}</p>
      <p className="text-sm text-slate-400 mt-1.5">Please try again or check your connection.</p>
    </div>
  );
}

interface DisclaimerProps {
  text?: string;
}

export function Disclaimer({ text }: DisclaimerProps) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 leading-relaxed">
      <span className="inline-flex items-center gap-1.5 font-bold text-slate-600 uppercase tracking-wide text-2xs flex-shrink-0 mt-px">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Note
      </span>
      <span>{text ?? 'This is a decision-support tool using synthetic data. Estimates are not predictions of individual employee behavior.'}</span>
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card text-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5 text-slate-400">
        {icon}
      </div>
      <h3 className="font-bold text-navy-900 text-lg mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">{description}</p>
      {action}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <div className={`card ${className}`}>
      <div className="mb-4">
        <h3 className="font-bold text-navy-900 text-[0.95rem] tracking-tight-2">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export const CHART_TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
  padding: '8px 12px',
  background: '#ffffff',
};

export const CHART_AXIS_TICK = { fontSize: 11, fill: '#94a3b8' };
