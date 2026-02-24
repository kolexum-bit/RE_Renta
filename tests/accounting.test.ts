import { describe, expect, it } from 'vitest';
import { escrowDisbursement, mortgageSplit, rollup, scheduleETotal, transferAffectsPnL } from '../src/main/services/financeMath';

describe('accounting validations', () => {
  it('rollups unit->property->llc', () => {
    const r = rollup([{ level: 'unit', key: 'unitA', amount: 100 }, { level: 'unit', key: 'unitA', amount: 20 }]);
    expect(r.unitA).toBe(120);
  });

  it('schedule E mapping totals', () => {
    expect(scheduleETotal([{ bucket: 'Rent Income', amount: 1000 }, { bucket: 'Repairs', amount: -200 }])).toBe(800);
  });

  it('transfers not affecting P&L', () => {
    expect(transferAffectsPnL('ASSET', 'ASSET')).toBe(false);
  });

  it('mortgage split correctness', () => {
    expect(mortgageSplit(1200, 700, 400, 100)).toEqual({ principal: 700, interest: 400, escrow: 100, pmi: 0, late: 0 });
  });

  it('escrow disbursement correctness', () => {
    expect(escrowDisbursement(500, 200)).toEqual({ endingEscrowAsset: 300, expenseRecognized: 200 });
  });
});
