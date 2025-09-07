import { getJSON } from "../../lib/api";
import type { DashboardSummary } from "../../types/dashboard";

export function fetchDashboardSummary(month: string) {
  // month => "YYYY-MM"
  return getJSON<DashboardSummary>(`/dashboard/summary?month=${encodeURIComponent(month)}`);
}
