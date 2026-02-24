export {};

declare global {
  interface Window {
    api: {
      isFirstRun: () => Promise<boolean>;
      runSetup: (payload: unknown) => Promise<void>;
      createTransaction: (payload: unknown) => Promise<void>;
      getKpi: (childLlcId?: number) => Promise<{ rentCollected: number; operatingExpenses: number; noi: number }>;
      getProfitLoss: () => Promise<Array<{ bucket: string; amount: number }>>;
      exportPdf: (name: string) => Promise<string>;
      backupNow: () => Promise<string | null>;
    };
  }
}
