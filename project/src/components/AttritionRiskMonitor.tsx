import { useState, useEffect, useMemo } from 'react';
import { Filter, Search, AlertTriangle } from 'lucide-react';
import { SectionHeader, LoadingSpinner, ErrorState, RiskBadge, PulseBadge, Disclaimer, EmptyState } from './ui';
import { fetchAllEmployees } from '@/lib/dataAccess';
import type { EmployeePulse } from '@/types';
import { DEPARTMENTS } from '@/types';

export function AttritionRiskMonitor() {
  const [employees, setEmployees] = useState<EmployeePulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAllEmployees()
      .then((data) => { setEmployees(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (deptFilter !== 'all' && e.department !== deptFilter) return false;
      if (riskFilter !== 'all') {
        const risk = e.estimated_attrition_risk;
        if (riskFilter === 'high' && risk < 61) return false;
        if (riskFilter === 'medium' && (risk < 31 || risk >= 61)) return false;
        if (riskFilter === 'low' && risk >= 31) return false;
      }
      if (search && !e.employee_id.toLowerCase().includes(search.toLowerCase()) && !e.department.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [employees, deptFilter, riskFilter, search]);

  const stats = useMemo(() => {
    const high = filtered.filter((e) => e.estimated_attrition_risk >= 61).length;
    const medium = filtered.filter((e) => e.estimated_attrition_risk >= 31 && e.estimated_attrition_risk < 61).length;
    const low = filtered.filter((e) => e.estimated_attrition_risk < 31).length;
    return { high, medium, low, total: filtered.length };
  }, [filtered]);

  if (loading) return <LoadingSpinner label="Loading risk data..." />;
  if (error) return <ErrorState message={error} />;

  const statCards = [
    { label: 'High Risk', count: stats.high, bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-600' },
    { label: 'Medium Risk', count: stats.medium, bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Low Risk', count: stats.low, bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Attrition Risk Monitor"
        subtitle="Estimated attrition risk by employee and team — not a prediction of resignation"
        icon={<AlertTriangle className="w-5 h-5" />}
      />

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card flex items-center gap-3.5 py-4">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`w-3 h-3 rounded-full ${s.dot}`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-navy-900 leading-none">{s.count}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Department</label>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="input-base">
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Risk Level</label>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="input-base">
              <option value="all">All Risk Levels</option>
              <option value="high">High (61-100%)</option>
              <option value="medium">Medium (31-60%)</option>
              <option value="low">Low (0-30%)</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee ID..."
                className="input-base pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="text-left px-5 py-3.5 font-bold text-2xs uppercase tracking-wider text-slate-500">Employee / Team</th>
                <th className="text-left px-5 py-3.5 font-bold text-2xs uppercase tracking-wider text-slate-500">Department</th>
                <th className="text-center px-5 py-3.5 font-bold text-2xs uppercase tracking-wider text-slate-500">Pulse</th>
                <th className="text-center px-5 py-3.5 font-bold text-2xs uppercase tracking-wider text-slate-500">Status</th>
                <th className="text-center px-5 py-3.5 font-bold text-2xs uppercase tracking-wider text-slate-500">Est. Risk</th>
                <th className="text-center px-5 py-3.5 font-bold text-2xs uppercase tracking-wider text-slate-500">Level</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((e) => (
                <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-navy-900">{e.employee_id}</td>
                  <td className="px-5 py-3 text-slate-600">{e.department}</td>
                  <td className="px-5 py-3 text-center font-bold text-navy-900">{e.pulse_score}</td>
                  <td className="px-5 py-3 text-center"><PulseBadge pulse={e.pulse_score} size="sm" /></td>
                  <td className="px-5 py-3 text-center font-bold text-navy-900">{e.estimated_attrition_risk}%</td>
                  <td className="px-5 py-3 text-center"><RiskBadge risk={e.estimated_attrition_risk} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="px-5 py-3 text-xs text-slate-400 bg-slate-50/50 border-t border-slate-100 font-medium">
            Showing 100 of {filtered.length} results. Use filters to narrow down.
          </div>
        )}
        {filtered.length === 0 && (
          <EmptyState
            icon={<Filter className="w-8 h-8" />}
            title="No matching results"
            description="No employees match the current filters. Try adjusting the department, risk level, or search criteria."
          />
        )}
      </div>

      <Disclaimer text="Estimated attrition risk is computed from pulse survey responses using a transparent scoring formula. It does not indicate whether any individual will resign." />
    </div>
  );
}
