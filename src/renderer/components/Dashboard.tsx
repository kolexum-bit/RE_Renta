import React, { useEffect, useState } from 'react';

export function Dashboard() {
  const [kpi, setKpi] = useState({ rentCollected: 0, operatingExpenses: 0, noi: 0 });
  const [tx, setTx] = useState({ date: '2025-01-01', payee: '', amount: 0, childLlcId: 2, propertyId: 1, unitId: 1, bankAccountId: 1, debitAccountId: 1, creditAccountId: 17 });
  const [pl, setPl] = useState<any[]>([]);

  const refresh = async () => {
    setKpi(await window.api.getKpi());
    setPl(await window.api.getProfitLoss());
  };
  useEffect(() => { refresh(); }, []);

  return <div className='layout'>
    <aside className='sidebar'>
      <h3>Holding (Consolidado)</h3>
      <p>Child LLC #1</p>
      <p>Búsqueda global</p>
      <button onClick={async () => alert(await window.api.backupNow())}>Backup now</button>
    </aside>
    <main className='main'>
      <h1>Home Dashboard</h1>
      <div className='card-grid'>
        <div className='card'><b>Rent Collected</b><div>{kpi.rentCollected.toFixed(2)}</div></div>
        <div className='card'><b>Operating Expenses</b><div>{kpi.operatingExpenses.toFixed(2)}</div></div>
        <div className='card'><b>NOI</b><div>{kpi.noi.toFixed(2)}</div></div>
      </div>
      <h2>Quick Actions</h2>
      <button onClick={refresh}>Actualizar</button>
      <button onClick={() => window.api.exportPdf('Profit & Loss')}>Generate report PDF</button>

      <h3>Add transaction</h3>
      {Object.entries(tx).map(([k, v]) => <div key={k}><label>{k}</label><input value={String(v)} onChange={(e) => setTx({ ...tx, [k]: Number.isNaN(Number(v)) ? e.target.value : Number(e.target.value) } as any)} /></div>)}
      <button onClick={async () => { await window.api.createTransaction(tx); refresh(); }}>Post Transaction</button>

      <h3>Alerts / To-do</h3>
      <ul><li>Unassigned imported transactions</li><li>Unreconciled months</li><li>Security deposit balances</li></ul>
      <h3>P&L Preview</h3>
      <pre>{JSON.stringify(pl, null, 2)}</pre>
    </main>
  </div>;
}
