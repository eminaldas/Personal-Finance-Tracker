// src/features/reports/reportApi.ts
import { getJSON } from "../../lib/api";
import type { ReportOut, ReportParams } from "../../types/reports";

/** /reports endpoint'inden özet veriyi çeker */
export async function fetchReport(params: ReportParams): Promise<ReportOut> {
  const qs = new URLSearchParams();
  if ("month" in params && params.month) qs.set("month", params.month);
  if ("start" in params && params.start) qs.set("start", params.start);
  if ("end" in params && params.end) qs.set("end", params.end);

  return getJSON<ReportOut>(`/reports?${qs.toString()}`);
}
