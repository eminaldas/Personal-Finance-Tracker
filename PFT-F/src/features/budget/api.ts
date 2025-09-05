import { getJSON, postJSON, apiFetch } from "../../lib/api";
import type { Budget, BudgetCreate, BudgetUpdate } from "../../types/budget";

// Liste
export async function fetchBudgets(month?: string): Promise<Budget[]> {
  const q = month ? `?month=${encodeURIComponent(month)}` : "";
  return getJSON<Budget[]>(`/budgets${q}`);
}

// Detay
export async function fetchBudget(id: string): Promise<Budget> {
  return getJSON<Budget>(`/budgets/${id}`);
}

export async function createBudget(input: BudgetCreate): Promise<Budget> {
  return postJSON<Budget>("/budgets", input);
}

export async function updateBudget(id: string, input: BudgetUpdate): Promise<Budget> {
  const res = await apiFetch(`/budgets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteBudget(id: string): Promise<{ id: string }> {
  const res = await apiFetch(`/budgets/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); 
}
