import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  isFirstRun: () => ipcRenderer.invoke('app:isFirstRun'),
  runSetup: (payload: unknown) => ipcRenderer.invoke('setup:run', payload),
  createTransaction: (payload: unknown) => ipcRenderer.invoke('tx:create', payload),
  getKpi: (childLlcId?: number) => ipcRenderer.invoke('dashboard:kpi', childLlcId),
  getProfitLoss: () => ipcRenderer.invoke('report:pl'),
  exportPdf: (name: string) => ipcRenderer.invoke('report:exportPdf', name),
  backupNow: () => ipcRenderer.invoke('backup:now')
});
