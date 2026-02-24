export type SetupPayload = {
  holding: { legalName: string; einPlaceholder: string; address: string };
  child: { legalName: string; einPlaceholder: string; address: string };
  property: { address: string; county: string; acquisitionDate: string; purchasePrice?: number };
  units: string[];
  bank: { name: string; type: string; last4: string; isEscrow: boolean };
  accountingBasis: 'CASH' | 'ACCRUAL';
  modules: { shortTerm: boolean; pmStatements: boolean; depreciation: boolean };
};

export type TransactionInput = {
  date: string;
  payee: string;
  memo?: string;
  amount: number;
  childLlcId: number;
  propertyId: number;
  unitId?: number;
  sharedFlag?: boolean;
  bankAccountId: number;
  debitAccountId: number;
  creditAccountId: number;
};
