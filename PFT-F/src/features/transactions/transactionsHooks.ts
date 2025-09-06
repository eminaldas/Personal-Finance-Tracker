// src/features/transactions/transactionsHooks.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

import type { Tx, TxCreate, TxUpdate, TxListParams } from "../../types/transactions";
import {
  listTransactions,
  createTransaction,
  deleteTransaction as apiDeleteTx,
} from "./transactionApi";
import { apiFetch } from "../../lib/api";

/* ---------- Query Keys ---------- */
const qk = {
  all: ["transactions"] as const,
  list: (params?: TxListParams) => [...qk.all, params ?? {}] as QueryKey,
  byId: (id: number) => [...qk.all, "detail", id] as QueryKey,
};

/* ---------- Queries ---------- */

export function useTransactions(params?: TxListParams) {
  return useQuery<Tx[]>({
    queryKey: qk.list(params),
    queryFn: () => listTransactions(params),
    staleTime: 30_000,
    // React Query v5: keepPreviousData yerine:
    placeholderData: keepPreviousData,
  });
}

/* ---------- Mutations ---------- */

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TxCreate) => createTransaction(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.all });
    },
  });
}

// PATCH: apiFetch ile doğrudan PATCH atalım
async function patchTx(id: number, payload: TxUpdate): Promise<Tx> {
  const res = await apiFetch(`/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Update failed");
  }
  return res.json();
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TxUpdate }) => patchTx(id, data),
    onSuccess: (tx) => {
      // detail cache'i güncelle (opsiyonel)
      qc.setQueryData<Tx>(qk.byId(tx.id), tx);
      // listeyi yenile
      qc.invalidateQueries({ queryKey: qk.all });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDeleteTx(id),

    // Optimistic UI (isteğe bağlı ama hoş)
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: qk.all });
      const prev = qc.getQueryData<Tx[]>(qk.all);
      if (prev) {
        qc.setQueryData<Tx[]>(
          qk.all,
          prev.filter((t) => t.id !== id)
        );
      }
      return { prev };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.all, ctx.prev);
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.all });
    },
  });
}
