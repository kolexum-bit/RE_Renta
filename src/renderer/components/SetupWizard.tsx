import React, { useState } from 'react';

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [form, setForm] = useState({
    holdingName: '', holdingEin: 'XX-XXXXXXX', holdingAddress: '',
    childName: '', childEin: 'XX-XXXXXXX', childAddress: '',
    propertyAddress: '', county: 'Miami-Dade', acquisitionDate: '2025-01-01', purchasePrice: '',
    units: 'A,B', bankName: 'Operating Checking', bankType: 'checking', last4: '1234', isEscrow: false,
    basis: 'CASH', shortTerm: false, pmStatements: true, depreciation: true
  });

  const submit = async () => {
    await window.api.runSetup({
      holding: { legalName: form.holdingName, einPlaceholder: form.holdingEin, address: form.holdingAddress },
      child: { legalName: form.childName, einPlaceholder: form.childEin, address: form.childAddress },
      property: { address: form.propertyAddress, county: form.county, acquisitionDate: form.acquisitionDate, purchasePrice: Number(form.purchasePrice || 0) },
      units: form.units.split(',').map((x) => x.trim()),
      bank: { name: form.bankName, type: form.bankType, last4: form.last4, isEscrow: form.isEscrow },
      accountingBasis: form.basis,
      modules: { shortTerm: form.shortTerm, pmStatements: form.pmStatements, depreciation: form.depreciation }
    });
    onComplete();
  };

  return <div className='main'><h1>Asistente Inicial</h1>
    {Object.entries(form).map(([k, v]) => typeof v === 'boolean'
      ? <label key={k}><input type='checkbox' checked={v} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} /> {k}</label>
      : <div key={k}><label>{k}</label><input value={v as string} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>)}
    <button onClick={submit}>Finalizar configuración</button>
  </div>;
}
