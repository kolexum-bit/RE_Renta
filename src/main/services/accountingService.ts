import { initDb } from '../db';
import { TransactionInput } from '@shared/types';

export function createPostedTransaction(input: TransactionInput) {
  if (!input.childLlcId || !input.propertyId || (!input.unitId && !input.sharedFlag)) {
    throw new Error('Missing required strict tagging. Transaction remains unposted.');
  }
  const db = initDb();
  const tx = db.transaction(() => {
    const trId = db.prepare(`INSERT INTO transactions(date,payee,memo,amount,child_llc_id,property_id,unit_id,shared_flag,bank_account_id,status)
      VALUES(?,?,?,?,?,?,?,?,?,'POSTED')`)
      .run(input.date, input.payee, input.memo ?? '', input.amount, input.childLlcId, input.propertyId, input.unitId ?? null, input.sharedFlag ? 1 : 0, input.bankAccountId).lastInsertRowid as number;

    db.prepare('INSERT INTO transaction_splits(transaction_id,account_id,amount,memo,unit_id,shared_flag) VALUES(?,?,?,?,?,?)')
      .run(trId, input.debitAccountId, input.amount, 'Debit', input.unitId ?? null, input.sharedFlag ? 1 : 0);
    db.prepare('INSERT INTO transaction_splits(transaction_id,account_id,amount,memo,unit_id,shared_flag) VALUES(?,?,?,?,?,?)')
      .run(trId, input.creditAccountId, -input.amount, 'Credit', input.unitId ?? null, input.sharedFlag ? 1 : 0);

    const jeId = db.prepare('INSERT INTO journal_entries(child_llc_id,date,memo,source_type,source_id) VALUES(?,?,?,?,?)')
      .run(input.childLlcId, input.date, input.memo ?? input.payee, 'TRANSACTION', trId).lastInsertRowid as number;

    db.prepare('INSERT INTO journal_lines(journal_entry_id,account_id,debit,credit,property_id,unit_id,shared_flag) VALUES(?,?,?,?,?,?,?)')
      .run(jeId, input.debitAccountId, input.amount, 0, input.propertyId, input.unitId ?? null, input.sharedFlag ? 1 : 0);
    db.prepare('INSERT INTO journal_lines(journal_entry_id,account_id,debit,credit,property_id,unit_id,shared_flag) VALUES(?,?,?,?,?,?,?)')
      .run(jeId, input.creditAccountId, 0, input.amount, input.propertyId, input.unitId ?? null, input.sharedFlag ? 1 : 0);
  });
  tx();
}

export function getKpi(childLlcId?: number) {
  const db = initDb();
  const where = childLlcId ? 'WHERE je.child_llc_id = ?' : '';
  const param = childLlcId ? [childLlcId] : [];
  const rent = db.prepare(`SELECT COALESCE(SUM(jl.credit - jl.debit),0) total FROM journal_lines jl JOIN chart_of_accounts coa ON coa.id=jl.account_id JOIN journal_entries je ON je.id=jl.journal_entry_id ${where} AND coa.schedule_e_bucket='Rent Income'`).get(...param) as { total: number };
  const expenses = db.prepare(`SELECT COALESCE(SUM(jl.debit - jl.credit),0) total FROM journal_lines jl JOIN chart_of_accounts coa ON coa.id=jl.account_id JOIN journal_entries je ON je.id=jl.journal_entry_id ${where} AND coa.account_type='EXPENSE'`).get(...param) as { total: number };
  return { rentCollected: rent.total, operatingExpenses: expenses.total, noi: rent.total - expenses.total };
}
