export type CatStat = {
  categoryId: number;
  name: string;
  emoji?: string;
  color?: string;
  type: "income" | "expense";
  total: number;
};

export type BudgetUsage = {
  budgetId: number;
  categoryId?: number | null;
  month: string;     // YYYY-MM
  limit: number;
  spent: number;
  usagePct: number;  // 0..100+
};

export type TxMini = {
  id: number;
  title: string;
  amount: number;
  categoryId: number;
  date: string;      // YYYY-MM-DD
  type: "income" | "expense";
};

export type DashboardSummary = {
  month: string;
  incomeTotal: number;
  expenseTotal: number;
  net: number;
  byCategory: CatStat[];
  recent: TxMini[];
  budgetUsage: BudgetUsage[];
};
