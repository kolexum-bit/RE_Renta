import React, { useEffect, useState } from 'react';
import { SetupWizard } from '../components/SetupWizard';
import { Dashboard } from '../components/Dashboard';

declare global { interface Window { api: any; } }

export function App() {
  const [firstRun, setFirstRun] = useState<boolean | null>(null);

  useEffect(() => { window.api.isFirstRun().then(setFirstRun); }, []);

  if (firstRun === null) return <div>Cargando...</div>;
  return firstRun ? <SetupWizard onComplete={() => setFirstRun(false)} /> : <Dashboard />;
}
