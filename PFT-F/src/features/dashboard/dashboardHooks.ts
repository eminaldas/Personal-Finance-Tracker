import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDashboardSummary } from "./dashboardApi";
import type { DashboardSummary } from "../../types/dashboard";

/** Query key factory (tek yerden yönetim) */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (month: string) => [...dashboardKeys.all, "summary", month] as const,
};

/** Ana hook – aylık özet */
export function useDashboard(month: string) {
  return useQuery({
    queryKey: dashboardKeys.summary(month),
    queryFn: () => fetchDashboardSummary(month),
    staleTime: 60_000,     // 1 dakika
    gcTime: 5 * 60_000,    // cache 5 dk
    // UI'da kullanışlı seçiciler istersen:
    // select: (d) => d, 
  });
}

/** Prefetch – route geçişlerinde hissedilir hız için */
export async function prefetchDashboard(qc: ReturnType<typeof useQueryClient>, month: string) {
  await qc.prefetchQuery({
    queryKey: dashboardKeys.summary(month),
    queryFn: () => fetchDashboardSummary(month),
    staleTime: 60_000,
  });
}

/** Cache'ten okuma (anında göster, sonra arkaplanda güncelle) */
export function getDashboardFromCache(
  qc: ReturnType<typeof useQueryClient>,
  month: string
): DashboardSummary | undefined {
  return qc.getQueryData(dashboardKeys.summary(month));
}
// src/utils/date.ts
export function ym(d = new Date()) {
  return d.toISOString().slice(0, 7); // "YYYY-MM"
}
