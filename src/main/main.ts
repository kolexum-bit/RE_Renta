import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { initDb, isFirstRun, getDbPath } from './db';
import { runSetup } from './services/setupService';
import { createPostedTransaction, getKpi } from './services/accountingService';
import { exportReportPdf, getProfitLoss } from './services/reportService';

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
  initDb();
  createMainWindow();
});

ipcMain.handle('app:isFirstRun', () => isFirstRun());
ipcMain.handle('setup:run', (_e, payload) => runSetup(payload));
ipcMain.handle('tx:create', (_e, payload) => createPostedTransaction(payload));
ipcMain.handle('dashboard:kpi', (_e, childLlcId) => getKpi(childLlcId));
ipcMain.handle('report:pl', () => getProfitLoss());
ipcMain.handle('report:exportPdf', (_e, name) => exportReportPdf(name));
ipcMain.handle('backup:now', async () => {
  const selected = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
  if (selected.canceled || !selected.filePaths[0]) return null;
  const target = path.join(selected.filePaths[0], `re-renta-backup-${Date.now()}.sqlite`);
  fs.copyFileSync(getDbPath(), target);
  return target;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
