// src/types/reports.ts
export type TxType = "income" | "expense";

export type ReportTxMini = {
  id: number;
  title: string;
  amount: number;
  categoryId: number | null;
  date: string; // "YYYY-MM-DD"
  type: TxType;
};

export type ReportKpis = {
  incomeTotal: number;
  expenseTotal: number;
  net: number;
  savingsRate: number;  // %
  txCount: number;
  avgTx: number;
  largestExpense?: ReportTxMini | null;
  mom?: {
    income: number | null;
    expense: number | null;
    net: number | null;
  } | null;
};

export type CashflowDaily = {
  date: string;   // "YYYY-MM-DD"
  income: number;
  expense: number;
  net: number;
};

export type CashflowMonthly = {
  month: string;  // "YYYY-MM"
  income: number;
  expense: number;
  net: number;
};

export type CatStat = {
  categoryId: number | null;
  name: string;
  emoji?: string | null;
  color?: string | null;
  type: TxType;
  total: number;
  sharePct: number;
  momPct?: number | null;
};

export type BudgetUsage = {
  budgetId: number;
  categoryId: number | null;
  limit: number;
  spent: number;
  usagePct: number;
  status: "ok" | "hit" | "over";
};

export type ReportOut = {
  period: { start: string; end: string };       // YYYY-MM
  currency: string;                              // e.g. "USD"
  kpis: ReportKpis;
  cashflow: {
    daily: CashflowDaily[];
    monthly: CashflowMonthly[];
  };
  byCategory: CatStat[];
  budgetUsage: BudgetUsage[];
  recent: ReportTxMini[];
  recurring: Array<Record<string, unknown>>;     // optional stub
  anomalies: Array<Record<string, unknown>>;     // optional stub
};

// Sorgu parametreleri: ya month ya da (start & end)
export type ReportParams =
  | { month: string; start?: never; end?: never }
  | { month?: never; start: string; end: string };
