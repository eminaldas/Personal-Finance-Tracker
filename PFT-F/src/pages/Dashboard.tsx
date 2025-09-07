import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

import { useDashboard, prefetchDashboard } from "../features/dashboard/dashboardHooks";
import type {  CatStat, BudgetUsage, TxMini } from "../types/dashboard";

/* ------------------------ utils ------------------------ */
function ym(d = new Date()) { return d.toISOString().slice(0, 7); }
function addMonths(d: Date, n: number) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }
function fmtCurrency(n: number) { return n.toLocaleString(undefined, { style: "currency", currency: "USD" }); }
function classNames(...c: Array<string | false | null | undefined>) { return c.filter(Boolean).join(" "); }
function monthLabel(key: string) {
  const [y,m] = key.split("-").map(Number); const d = new Date(y, (m - 1), 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

/* ------------------- charts helpers -------------------- */
function toDailySeries(recent: TxMini[], monthKey: string) {
  // Build 1..31 sparse series from recent (approx if server limits to N items)
  const byDay: Record<string, { day: string; income: number; expense: number }> = {};
  for (const t of recent) {
    if (!t.date.startsWith(monthKey)) continue;
    const day = t.date.slice(8, 10);
    if (!byDay[day]) byDay[day] = { day, income: 0, expense: 0 };
    byDay[day][t.type] += t.amount;
  }
  return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
}

function pieFromCategories(byCategory: CatStat[]) {
  const exp = byCategory.filter((c) => c.type === "expense");
  // recharts expects { name, value }
  return exp.map((c) => ({ name: c.emoji ? `${c.emoji} ${c.name}` : c.name, value: c.total, color: c.color || undefined }));
}

function usageColor(pct: number) {
  if (pct < 60) return "bg-emerald-400";
  if (pct < 90) return "bg-amber-400";
  return "bg-rose-400";
}

const fallbackColors = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#facc15", "#60a5fa", "#fb7185", "#93c5fd"]; // cyan,violet,pink,emerald,amber,blue,rose,sky

/* ---------------------- component ---------------------- */
export default function DashboardPage() {
  const [month, setMonth] = useState<string>(ym());
  const qc = useQueryClient();
  const prev = ym(addMonths(new Date(), -1));

  const { data: curr, isLoading } = useDashboard(month);
  const { data: prevSummary } = useDashboard(prev);

  // Prefetch neighbors for snappy UX
  const months = [month, prev, ym(addMonths(new Date(), -2))];

  const monthOptions = useMemo(() => {
    const now = new Date();
    return [0, -1, -2].map((off) => {
      const key = ym(addMonths(now, off));
      return { key, label: monthLabel(key) };
    });
  }, []);

  const dailySeries = useMemo(() => toDailySeries(curr?.recent ?? [], month), [curr, month]);
  const pieData = useMemo(() => pieFromCategories(curr?.byCategory ?? []), [curr]);

  const mom = useMemo(() => {
    if (!curr || !prevSummary) return null;
    const p = (a: number, b: number) => (b === 0 ? null : ((a - b) / Math.abs(b)) * 100);
    return {
      income: p(curr.incomeTotal, prevSummary.incomeTotal),
      expense: p(curr.expenseTotal, prevSummary.expenseTotal),
      net: p(curr.net, prevSummary.net),
    } as const;
  }, [curr, prevSummary]);

  return (
    <div className="relative">
      {/* Header */}
      <header className="relative z-10 mx-auto flex items-center justify-between gap-4 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
            {/* hexagon icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l9 5v10l-9 5-9-5V7l9-5Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">Overview</h1>
            <p className="text-xs text-white/60">Personal Finance Tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={async (e) => {
              setMonth(e.target.value);
              // prefetch neighbors of the newly selected month
              const idx = monthOptions.findIndex((m) => m.key === e.target.value);
              const toPrefetch = monthOptions
                .filter((_, i) => Math.abs(i - idx) === 1)
                .map((m) => m.key);
              for (const m of toPrefetch) { await prefetchDashboard(qc, m); }
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {monthOptions.map((m) => (
              <option key={m.key} value={m.key} className="bg-[#111318]">{m.label}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="relative z-10 mx-auto px-6 pb-14">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Kpi
            title="Net"
            value={fmtCurrency(curr?.net ?? 0)}
            delta={mom?.net ?? null}
            loading={isLoading}
          />
          <Kpi
            title="Income"
            value={fmtCurrency(curr?.incomeTotal ?? 0)}
            delta={mom?.income ?? null}
            positive
            loading={isLoading}
          />
          <Kpi
            title="Expense"
            value={fmtCurrency(curr?.expenseTotal ?? 0)}
            delta={mom?.expense ?? null}
            negative
            loading={isLoading}
          />
        </div>

        {/* Area + Pie */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:col-span-2">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h3 className="text-sm font-medium">Income vs Expense</h3>
                <p className="text-xs text-white/60">{monthLabel(month)} by day</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySeries} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
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
                  <XAxis dataKey="day" stroke="#9aa0a6" tickLine={false} axisLine={false} />
                  <YAxis stroke="#9aa0a6" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                  <Area type="monotone" dataKey="income" stroke="#22d3ee" fill="url(#inc)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="#f472b6" fill="url(#exp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="mb-3">
              <h3 className="text-sm font-medium">Spending by Category</h3>
              <p className="text-xs text-white/60">{monthLabel(month)}</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={pieData} innerRadius={46} outerRadius={76} paddingAngle={3}>
                    {pieData.map((p, i) => (
                      <Cell key={i} fill={p.color || fallbackColors[i % fallbackColors.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={24} wrapperStyle={{ color: "#cbd5e1" }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Budgets + Recent */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">Recent Transactions</h3>
              <Link to="/transactions" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition hover:bg-white/10">View all</Link>
            </div>
            <RecentTable rows={curr?.recent ?? []} loading={isLoading} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="mb-3">
              <h3 className="text-sm font-medium">Budgets</h3>
              <p className="text-xs text-white/60">Monthly utilization</p>
            </div>
            <BudgetList rows={curr?.budgetUsage ?? []} loading={isLoading} />
          </div>
        </div>

        {/* Top categories (bar) */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h3 className="text-sm font-medium">Top Expense Categories</h3>
              <p className="text-xs text-white/60">{monthLabel(month)}</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(curr?.byCategory ?? []).filter(c => c.type === "expense").map(c => ({
                name: c.emoji ? `${c.emoji} ${c.name}` : c.name,
                total: c.total,
                color: c.color || undefined,
              }))}>
                <CartesianGrid strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="name" stroke="#9aa0a6" tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={48} />
                <YAxis stroke="#9aa0a6" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtCurrency(v)} />
                <Bar dataKey="total">
                  {(curr?.byCategory ?? []).map((c, i) => (
                    <Cell key={i} fill={c.color || fallbackColors[i % fallbackColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------------- sub components ---------------------- */
function Kpi({ title, value, delta, positive, negative, loading }: { title: string; value: string; delta: number | null; positive?: boolean; negative?: boolean; loading?: boolean; }) {
  const color = negative ? "text-rose-300" : positive ? "text-emerald-300" : "text-white";
  let deltaTxt = ""; let deltaColor = "text-white/60"; let arrow = null as React.ReactNode;
  if (delta !== null) {
    const up = delta > 0; const abs = Math.abs(delta).toFixed(1) + "%";
    deltaTxt = (up ? "+" : "-") + abs;
    arrow = up ? (
      <svg viewBox="0 0 20 20" className="h-3 w-3"><path d="M10 3l6 6H4l6-6Zm0 14V3" fill="currentColor"/></svg>
    ) : (
      <svg viewBox="0 0 20 20" className="h-3 w-3"><path d="M10 17l-6-6h12l-6 6Zm0-14v14" fill="currentColor"/></svg>
    );
    deltaColor = up ? "text-emerald-300" : "text-rose-300";
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="text-xs text-white/60">{title}</div>
      <div className={classNames("mt-1 text-2xl font-semibold", color)}>{loading ? <Skeleton w={96} /> : value}</div>
      <div className="mt-1 flex items-center gap-1 text-[11px] text-white/50">
        {delta !== null && <span className={classNames(deltaColor, "inline-flex items-center gap-1")}>{arrow}{deltaTxt}</span>}
        <span className="text-white/50">vs last month</span>
      </div>
    </div>
  );
}

function RecentTable({ rows, loading }: { rows: TxMini[]; loading?: boolean }) {
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
          {rows.slice(0, 8).map((t) => (
            <tr key={t.id} className="border-b border-white/5 last:border-0">
              <td className="py-2">{t.title}</td>
              <td className="py-2 text-white/70">{t.categoryId}</td>
              <td className="py-2 text-white/60">{new Date(t.date + "T00:00:00").toLocaleDateString()}</td>
              <td className="py-2 text-right font-medium">
                <span className={t.type === "expense" ? "text-rose-300" : "text-emerald-300"}>
                  {t.type === "expense" ? "-" : "+"}{fmtCurrency(t.amount)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BudgetList({ rows, loading }: { rows: BudgetUsage[]; loading?: boolean }) {
  if (loading) {
    return (
      <ul className="space-y-3 text-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="h-14 w-full rounded-xl bg-white/5 ring-1 ring-white/10" />
        ))}
      </ul>
    );
  }
  if (!rows.length) return <div className="text-sm text-white/60">No budgets for this month.</div>;
  return (
    <ul className="space-y-3 text-sm">
      {rows.map((b) => (
        <li key={b.budgetId} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-white/80">{b.categoryId ? `#${b.categoryId}` : "General"}</span>
            <span className={b.usagePct > 100 ? "text-rose-300" : "text-white/60"}>
              {fmtCurrency(b.spent)} / {fmtCurrency(b.limit)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className={classNames("h-full", usageColor(b.usagePct))} style={{ width: `${Math.min(100, b.usagePct)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Skeleton({ w = 64, h = 24 }: { w?: number; h?: number }) {
  return <div style={{ width: w, height: h }} className="inline-block animate-pulse rounded-md bg-white/10 align-middle" />;
}

const tooltipStyle = {
  background: "rgba(17,19,24,0.9)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "#fff",
} as const;
