import { initDb } from '../db';
import { SetupPayload } from '@shared/types';

const scheduleE = [
  'Rent Income','Advertising','Auto/Travel','Cleaning/Maintenance','Commissions','Insurance','Legal/Professional',
  'Management Fees','Mortgage Interest','Other Interest','Repairs','Supplies','Taxes','Utilities','Depreciation','Other'
];

export function runSetup(payload: SetupPayload) {
  const db = initDb();
  const tx = db.transaction(() => {
    const holdingId = db.prepare(`INSERT INTO llc_entities(type,legal_name,ein_placeholder,address_line1) VALUES('HOLDING',?,?,?)`)
      .run(payload.holding.legalName, payload.holding.einPlaceholder, payload.holding.address).lastInsertRowid as number;
    const childId = db.prepare(`INSERT INTO llc_entities(type,parent_id,legal_name,ein_placeholder,address_line1) VALUES('CHILD',?,?,?,?)`)
      .run(holdingId, payload.child.legalName, payload.child.einPlaceholder, payload.child.address).lastInsertRowid as number;
    const propertyId = db.prepare(`INSERT INTO properties(child_llc_id,address,county,acquisition_date,purchase_price) VALUES(?,?,?,?,?)`)
      .run(childId, payload.property.address, payload.property.county, payload.property.acquisitionDate, payload.property.purchasePrice ?? null).lastInsertRowid as number;
    payload.units.forEach((u) => db.prepare('INSERT INTO units(property_id,unit_label) VALUES(?,?)').run(propertyId, u));
    db.prepare('INSERT INTO bank_accounts(child_llc_id,name,type,last4,is_escrow) VALUES(?,?,?,?,?)')
      .run(childId, payload.bank.name, payload.bank.type, payload.bank.last4, payload.bank.isEscrow ? 1 : 0);

    for (const bucket of scheduleE) {
      db.prepare('INSERT INTO chart_of_accounts(child_llc_id,account_type,name,schedule_e_bucket,is_system) VALUES(?,?,?,?,1)')
        .run(childId, bucket === 'Rent Income' ? 'INCOME' : 'EXPENSE', bucket, bucket);
    }
    db.prepare("INSERT INTO chart_of_accounts(child_llc_id,account_type,name,is_system) VALUES(?, 'ASSET', 'Bank Checking',1)").run(childId);
    db.prepare("INSERT INTO chart_of_accounts(child_llc_id,account_type,name,is_system) VALUES(?, 'ASSET', 'Escrow Asset',1)").run(childId);
    db.prepare("INSERT INTO chart_of_accounts(child_llc_id,account_type,name,is_system) VALUES(?, 'LIABILITY', 'Mortgage Loan',1)").run(childId);
    db.prepare("INSERT INTO chart_of_accounts(child_llc_id,account_type,name,is_system) VALUES(?, 'LIABILITY', 'Security Deposit Liability',1)").run(childId);

    db.prepare('UPDATE app_settings SET accounting_basis=?, setup_complete=1, short_term_module=?, pm_module=?, depreciation_module=? WHERE id=1')
      .run(payload.accountingBasis, payload.modules.shortTerm ? 1 : 0, payload.modules.pmStatements ? 1 : 0, payload.modules.depreciation ? 1 : 0);
  });
  tx();
}
