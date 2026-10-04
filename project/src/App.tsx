import { useState } from 'react';
import { Layout, type Page } from '@/components/Layout';
import { Landing } from '@/components/Landing';
import { Dashboard } from '@/components/Dashboard';
import { EmployeePulse } from '@/components/EmployeePulse';
import { AttritionRiskMonitor } from '@/components/AttritionRiskMonitor';
import { RootCauseAnalysis } from '@/components/RootCauseAnalysis';
import { AIWorkmate } from '@/components/AIWorkmate';
import { WhatIfSimulator } from '@/components/WhatIfSimulator';
import { ScenarioComparison } from '@/components/ScenarioComparison';
import { Reports } from '@/components/Reports';

function App() {
  const [page, setPage] = useState<Page>('landing');

  const handleNavigate = (p: Page) => {
    setPage(p);
    window.scrollTo(0, 0);
  };

  if (page === 'landing') {
    return <Landing onNavigate={handleNavigate} />;
  }

  return (
    <Layout current={page} onNavigate={handleNavigate}>
      {page === 'dashboard' && <Dashboard />}
      {page === 'pulse' && <EmployeePulse />}
      {page === 'risk' && <AttritionRiskMonitor />}
      {page === 'rootcause' && <RootCauseAnalysis />}
      {page === 'aiworkmate' && <AIWorkmate />}
      {page === 'simulator' && <WhatIfSimulator />}
      {page === 'comparison' && <ScenarioComparison />}
      {page === 'reports' && <Reports />}
    </Layout>
  );
}

export default App;
