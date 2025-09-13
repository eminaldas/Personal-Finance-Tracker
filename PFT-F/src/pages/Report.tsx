import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useReport, prefetchReport } from "../features/reports/reportHooks";
import type {
  ReportOut,
  ReportParams,
  ReportTxMini,
  CashflowDaily,
  CashflowMonthly,
  CatStat,
  BudgetUsage,
} from "../types/reports";

/* ------------------------ helpers ------------------------ */
function ym(d = new Date()) {
  return d.toISOString().slice(0, 7);
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}
function fmtCurrency(n: number, cur = "USD") {
  return n.toLocaleString(undefined, { style: "currency", currency: cur });
}
function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}
function usageColor(pct: number) {
  if (pct < 60) return "bg-emerald-400";
  if (pct < 90) return "bg-amber-400";
  return "bg-rose-400";
}
const fallbackColors = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#facc15", "#60a5fa", "#fb7185", "#93c5fd"];
const tooltipStyle = {
  background: "rgba(17,19,24,0.9)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#fff",
} as const;

/* ------------------------ page ------------------------ */
export default function ReportsPage() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"month" | "range">("month");
  const [month, setMonth] = useState<string>(ym());
  const [start, setStart] = useState<string>(ym(addMonths(new Date(), -2)));
  const [end, setEnd] = useState<string>(ym());

  const params: ReportParams =
    mode === "month" ? { month } : { start, end };

  const { data, isLoading, error } = useReport(params);

  // komşu ayları prefetch (ay modu iken)
  const monthOptions = useMemo(() => {
    const now = new Date();
    return [0, -1, -2, -3].map((off) => {
      const key = ym(addMonths(now, off));
      return { key, label: monthLabel(key) };
    });
  }, []);
  const onChangeMonth = async (val: string) => {
    setMonth(val);
    const idx = monthOptions.findIndex((m) => m.key === val);
    const toPrefetch = monthOptions.filter((_, i) => Math.abs(i - idx) === 1).map((m) => m.key);
    for (const mk of toPrefetch) await prefetchReport(qc, { month: mk });
  };

  const currency = data?.currency ?? "USD";

  // Grafik veri hazırlıkları
  const daily = (data?.cashflow.daily ?? []) as CashflowDaily[];
  const monthly = (data?.cashflow.monthly ?? []) as CashflowMonthly[];
  const pieData = useMemo(
    () =>
      (data?.byCategory ?? [])
        .filter((c) => c.type === "expense")
        .map((c, i) => ({
          name: c.emoji ? `${c.emoji} ${c.name}` : c.name,
          value: c.total,
          color: c.color || fallbackColors[i % fallbackColors.length],
        })),
    [data?.byCategory]
  );

  return (
    <div className="relative">
      {/* Header / filters */}
      <header className="relative z-10 mx-auto flex flex-wrap items-end justify-between gap-4 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l9 5v10l-9 5-9-5V7l9-5Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">Reports</h1>
            <p className="text-xs text-white/60">Financial insights & exportable summaries</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setMode("month")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs",
                mode === "month" ? "bg-white/10 text-cyan-300" : "text-white/70 hover:bg-white/5"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setMode("range")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs",
                mode === "range" ? "bg-white/10 text-cyan-300" : "text-white/70 hover:bg-white/5"
              )}
            >
              Range
            </button>
          </div>

          {mode === "month" ? (
            <select
              value={month}
              onChange={(e) => onChangeMonth(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {monthOptions.map((m) => (
                <option key={m.key} value={m.key} className="bg-[#111318]">
                  {m.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <span className="text-white/60 text-xs">to</span>
              <input
                type="month"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          )}

          <button
            onClick={() => exportCsv(data?.recent ?? [], currency)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 backdrop-blur transition hover:bg-white/10"
          >
            Export CSV
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto px-6 pb-14">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Kpi
            title="Net"
            value={fmtCurrency(data?.kpis.net ?? 0, currency)}
            delta={data?.kpis.mom?.net ?? null}
            hint="vs last period"
            loading={isLoading}
          />
          <Kpi
            title="Income"
            value={fmtCurrency(data?.kpis.incomeTotal ?? 0, currency)}
            delta={data?.kpis.mom?.income ?? null}
            positive
            hint="vs last period"
            loading={isLoading}
          />
          <Kpi
            title="Expense"
            value={fmtCurrency(data?.kpis.expenseTotal ?? 0, currency)}
            delta={data?.kpis.mom?.expense ?? null}
            negative
            hint="vs last period"
            loading={isLoading}
          />
          <Kpi
            title="Savings Rate"
            value={`${(data?.kpis.savingsRate ?? 0).toFixed(1)}%`}
            delta={null}
            hint="of income"
            loading={isLoading}
          />
        </div>

        {/* Cashflow charts */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Daily Cashflow" subtitle={mode === "month" ? monthLabel(month) : "Selected range"}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#f472b6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="date" stroke="#9aa0a6" tickLine={false} axisLine={false} />
                  <YAxis stroke="#9aa0a6" tickLine={false} axisLine={false} tickFormatter={(v) => fmtCurrency(v as number, currency)} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: "#fff" }}
                    formatter={(v: number) => [fmtCurrency(v, currency), ""]}
                  />
                  <Area type="monotone" dataKey="income" stroke="#22d3ee" fill="url(#inc)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="#f472b6" fill="url(#exp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Monthly Cashflow" subtitle="Trend (net)">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="month" stroke="#9aa0a6" tickLine={false} axisLine={false} />
                  <YAxis stroke="#9aa0a6" tickLine={false} axisLine={false} tickFormatter={(v) => fmtCurrency(v as number, currency)} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtCurrency(v, currency)} />
                  <Bar dataKey="net">
                    {monthly.map((_, i) => (
                      <Cell key={i} fill={i % 2 ? "#22d3ee" : "#a78bfa"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Category pie + Budgets */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Spending by Category" subtitle={mode === "month" ? monthLabel(month) : "Selected range"}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={pieData} innerRadius={46} outerRadius={76} paddingAngle={3}>
                    {pieData.map((p, i) => (
                      <Cell key={i} fill={p.color || fallbackColors[i % fallbackColors.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={24} wrapperStyle={{ color: "#cbd5e1" }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="lg:col-span-2" title="Budgets" subtitle="Monthly utilization">
            <BudgetList rows={data?.budgetUsage ?? []} currency={currency} loading={isLoading} />
          </Card>
        </div>

        {/* Extremes + Recurring/Anomalies + Recent */}
        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card title="Largest Expense" subtitle="This period">
            <Largest tx={data?.kpis.largestExpense ?? null} currency={currency} loading={isLoading} />
          </Card>

          <Card title="Recurring (preview)" subtitle="Detected patterns">
            <TinyList rows={data?.recurring ?? []} />
          </Card>

          <Card title="Anomalies (preview)" subtitle="Outliers & spikes">
            <TinyList rows={data?.anomalies ?? []} />
          </Card>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Recent Transactions</h3>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                exportCsv(data?.recent ?? [], currency);
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition hover:bg-white/10"
            >
              Export CSV
            </a>
          </div>
          <RecentTable rows={data?.recent ?? []} currency={currency} loading={isLoading} />
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            Failed to load report.
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------------------- sub components ---------------------- */
function Card({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl", className)}>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Kpi({
  title,
  value,
  delta,
  hint,
  positive,
  negative,
  loading,
}: {
  title: string;
  value: string;
  delta: number | null;
  hint?: string;
  positive?: boolean;
  negative?: boolean;
  loading?: boolean;
}) {
  const color = negative ? "text-rose-300" : positive ? "text-emerald-300" : "text-white";
  let deltaTxt = "";
  let deltaColor = "text-white/60";
  let arrow: React.ReactNode = null;
  if (delta !== null) {
    const up = delta > 0;
    const abs = Math.abs(delta).toFixed(1) + "%";
    deltaTxt = (up ? "+" : "-") + abs;
    arrow = up ? (
      <svg viewBox="0 0 20 20" className="h-3 w-3">
        <path d="M10 3l6 6H4l6-6Zm0 14V3" fill="currentColor" />
      </svg>
    ) : (
      <svg viewBox="0 0 20 20" className="h-3 w-3">
        <path d="M10 17l-6-6h12l-6 6Zm0-14v14" fill="currentColor" />
      </svg>
    );
    deltaColor = up ? "text-emerald-300" : "text-rose-300";
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="text-xs text-white/60">{title}</div>
      <div className={cn("mt-1 text-2xl font-semibold", color)}>{loading ? <Skeleton w={96} /> : value}</div>
      <div className="mt-1 flex items-center gap-1 text-[11px] text-white/50">
        {delta !== null && <span className={cn(deltaColor, "inline-flex items-center gap-1")}>{arrow}{deltaTxt}</span>}
        {hint && <span className="text-white/50">{hint}</span>}
      </div>
    </div>
  );
}

function BudgetList({ rows, currency, loading }: { rows: BudgetUsage[]; currency: string; loading?: boolean }) {
  if (loading) {
    return (
      <ul className="space-y-3 text-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="h-14 w-full rounded-xl bg-white/5 ring-1 ring-white/10" />
        ))}
      </ul>
    );
  }
  if (!rows.length) return <div className="text-sm text-white/60">No budgets for this period.</div>;
  return (
    <ul className="space-y-3 text-sm">
      {rows.map((b) => (
        <li key={b.budgetId} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-white/80">{b.categoryId ? `#${b.categoryId}` : "General"}</span>
            <span className={b.usagePct > 100 ? "text-rose-300" : "text-white/60"}>
              {fmtCurrency(b.spent, currency)} / {fmtCurrency(b.limit, currency)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className={cn("h-full", usageColor(b.usagePct))} style={{ width: `${Math.min(100, b.usagePct)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function RecentTable({ rows, currency, loading }: { rows: ReportTxMini[]; currency: string; loading?: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-full rounded-lg bg-white/5 ring-1 ring-white/10" />
        ))}
      </div>
    );
  }
  if (!rows.length) {
    return <div className="text-sm text-white/60">No recent transactions.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-white/60">
          <tr className="border-b border-white/10">
            <th className="py-2 font-medium">Title</th>
            <th className="py-2 font-medium">Category</th>
            <th className="py-2 font-medium">Date</th>
            <th className="py-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((t) => (
            <tr key={t.id} className="border-b border-white/5 last:border-0">
              <td className="py-2">{t.title}</td>
              <td className="py-2 text-white/70">{t.categoryId ?? "-"}</td>
              <td className="py-2 text-white/60">{new Date(t.date + "T00:00:00").toLocaleDateString()}</td>
              <td className="py-2 text-right font-medium">
                <span className={t.type === "expense" ? "text-rose-300" : "text-emerald-300"}>
                  {t.type === "expense" ? "-" : "+"}{fmtCurrency(t.amount, currency)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Largest({ tx, currency, loading }: { tx: ReportTxMini | null | undefined; currency: string; loading?: boolean }) {
  if (loading) return <div className="h-16 w-full animate-pulse rounded-lg bg-white/5" />;
  if (!tx) return <div className="text-sm text-white/60">No expenses in this period.</div>;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-1 text-sm text-white/70">{tx.title}</div>
      <div className="text-sm text-white/50">{new Date(tx.date + "T00:00:00").toLocaleDateString()}</div>
      <div className="mt-1 text-lg font-semibold text-rose-300">-{fmtCurrency(tx.amount, currency)}</div>
    </div>
  );
}

function TinyList({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (!rows?.length) return <div className="text-sm text-white/60">No data.</div>;
  return (
    <ul className="space-y-2 text-sm">
      {rows.slice(0, 6).map((r, i) => (
        <li key={i} className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70">
          {JSON.stringify(r)}
        </li>
      ))}
    </ul>
  );
}

function Skeleton({ w = 64, h = 24 }: { w?: number; h?: number }) {
  return <div style={{ width: w, height: h }} className="inline-block animate-pulse rounded-md bg-white/10 align-middle" />;
}

/* ------------------------ export CSV ------------------------ */
function exportCsv(rows: ReportTxMini[], currency: string) {
  if (!rows?.length) return;
  const header = ["id", "title", "type", "categoryId", "date", `amount(${currency})`];
  const body = rows.map((r) => [r.id, r.title, r.type, r.categoryId ?? "", r.date, r.amount]);
  const lines = [header, ...body].map((cols) =>
    cols
      .map((c) => {
        const s = String(c ?? "");
        // basit CSV-escape
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(",")
  );
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
