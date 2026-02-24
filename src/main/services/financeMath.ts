export type LedgerLine = { level: 'unit'|'property'|'llc'; key: string; amount: number };

export function rollup(lines: LedgerLine[]) {
  return lines.reduce<Record<string, number>>((acc, l) => {
    acc[l.key] = (acc[l.key] ?? 0) + l.amount;
    return acc;
  }, {});
}

export function scheduleETotal(rows: Array<{ bucket: string; amount: number }>) {
  return rows.reduce((sum, r) => sum + r.amount, 0);
}

export function transferAffectsPnL(accountTypeA: string, accountTypeB: string) {
  const pnlTypes = new Set(['INCOME', 'EXPENSE']);
  return pnlTypes.has(accountTypeA) || pnlTypes.has(accountTypeB);
}

export function mortgageSplit(total: number, principal: number, interest: number, escrow = 0, pmi = 0, late = 0) {
  if (Math.abs(total - (principal + interest + escrow + pmi + late)) > 0.01) throw new Error('Unbalanced mortgage split');
  return { principal, interest, escrow, pmi, late };
}

export function escrowDisbursement(escrowAsset: number, disbursement: number) {
  return { endingEscrowAsset: escrowAsset - disbursement, expenseRecognized: disbursement };
}
