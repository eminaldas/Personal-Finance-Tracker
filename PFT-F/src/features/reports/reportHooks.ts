// src/features/reports/reportHooks.ts
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
  type QueryKey,
} from "@tanstack/react-query";
import { fetchReport } from "./reportApi";
import type { ReportOut, ReportParams } from "../../types/reports";

/** Query key factory */
export const reportKeys = {
  all: ["reports"] as const,
  summary: (params: ReportParams) =>
    [...reportKeys.all, normalizeParams(params)] as QueryKey,
};

/** Params’i normalize et (key tutarlılığı için) */
function normalizeParams(params: ReportParams) {
  if ("month" in params && params.month) {
    return { month: params.month };
  }
  return { start: params.start, end: params.end };
}

/** Ana hook: tek ay veya aralık için rapor */
export function useReport(params: ReportParams) {
  return useQuery<ReportOut>({
    queryKey: reportKeys.summary(params),
    queryFn: () => fetchReport(params),
    staleTime: 60_000,           // 1 dk taze
    gcTime: 5 * 60_000,          // 5 dk cache
    placeholderData: keepPreviousData,
  });
}

/** Prefetch: komşu ay/aylar için önceden ısıt */
export async function prefetchReport(
  qc: ReturnType<typeof useQueryClient>,
  params: ReportParams
) {
  await qc.prefetchQuery({
    queryKey: reportKeys.summary(params),
    queryFn: () => fetchReport(params),
    staleTime: 60_000,
  });
}

/** Cache’ten oku (UI’da anında gösterip sonra güncellemek için) */
export function getReportFromCache(
  qc: ReturnType<typeof useQueryClient>,
  params: ReportParams
): ReportOut | undefined {
  return qc.getQueryData<ReportOut>(reportKeys.summary(params));
}
