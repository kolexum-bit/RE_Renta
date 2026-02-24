import { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { initDb } from '../db';

export function getProfitLoss() {
  const db = initDb();
  return db.prepare(`SELECT coa.schedule_e_bucket bucket, SUM(jl.debit - jl.credit) amount
    FROM journal_lines jl JOIN chart_of_accounts coa ON coa.id=jl.account_id
    WHERE coa.account_type='EXPENSE' OR coa.schedule_e_bucket='Rent Income'
    GROUP BY coa.schedule_e_bucket`).all();
}

export async function exportReportPdf(reportName: string) {
  const rows = getProfitLoss() as Array<{ bucket: string; amount: number }>;
  const html = `<html><body><h1>${reportName}</h1><table border='1' cellspacing='0' cellpadding='4'>${rows
    .map((r) => `<tr><td>${r.bucket}</td><td>${r.amount.toFixed(2)}</td></tr>`).join('')}</table></body></html>`;

  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: false } });
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  const pdf = await win.webContents.printToPDF({ pageSize: 'Letter' });
  const filePath = path.join(process.cwd(), `report-${Date.now()}.pdf`);
  fs.writeFileSync(filePath, pdf);

  const viewWin = new BrowserWindow({ width: 1000, height: 800 });
  await viewWin.loadURL(`file://${filePath}`);
  return filePath;
}
