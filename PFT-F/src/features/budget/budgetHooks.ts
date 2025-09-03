import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Budget, BudgetCreate, BudgetUpdate } from "../../types/budget";
import {
  fetchBudgets,
  fetchBudget,
  createBudget,
  updateBudget,
  deleteBudget,
} from "./api";

const key = (month?: string) => ["budgets", month ?? "all"];

export function useBudgets(month?: string) {
  return useQuery<Budget[]>({
    queryKey: key(month),
    queryFn: () => fetchBudgets(month),
    staleTime: 60_000,
  });
}

export function useBudget(id: string) {
  return useQuery<Budget>({
    queryKey: ["budget", id],
    queryFn: () => fetchBudget(id),
    enabled: !!id,
  });
}

export function useCreateBudget(month?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetCreate) => createBudget(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(month) }),
  });
}

export function useUpdateBudget(month?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BudgetUpdate }) =>
      updateBudget(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: key(month) });
      const prev = qc.getQueryData<Budget[]>(key(month));
      if (prev) {
        qc.setQueryData<Budget[]>(
          key(month),
          prev.map((b) => (b.id === id ? { ...b, ...input } as Budget : b))
        );
      }
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key(month), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key(month) }),
  });
}

export function useDeleteBudget(month?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key(month) });
      const prev = qc.getQueryData<Budget[]>(key(month));
      if (prev) {
        qc.setQueryData<Budget[]>(key(month), prev.filter((b) => b.id !== id));
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(key(month), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key(month) }),
  });
}
