export type TxType = "income" | "expense";

/* ---------- Core Models ---------- */

export type Tx = {
  id: number;
  title: string;
  amount: number;       // positive
  categoryId: number;
  date: string;         // YYYY-MM-DD
  note?: string | null;
  type: TxType;         // türetilmiş: income | expense
};

export type TxCreate = {
  title: string;
  amount: number;
  categoryId: number;
  date: string;         // YYYY-MM-DD
  note?: string | null;
};

export type TxUpdate = Partial<TxCreate>;

/* ---------- API Params ---------- */

export type TxListParams = {
  start?: string;       // YYYY-MM-DD (inclusive)
  end?: string;         // YYYY-MM-DD (inclusive)
  categoryId?: number;
  type?: TxType;
  q?: string;           // search query
  limit?: number;       // default 100
  offset?: number;      // default 0
};

/* ---------- API Responses ---------- */

export type TxListResponse = Tx[];   // simple array

export type TxDetailResponse = Tx;

export type TxDeleteResponse = {
  success: boolean;
  id: number;
};
