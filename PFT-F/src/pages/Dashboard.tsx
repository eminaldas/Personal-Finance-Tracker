import { useMemo, useState } from "react";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";

export default function DashboardPage() {
  const [month, setMonth] = useState<string>(currentMonthKey());
  const [q, setQ] = useState<string>("");

  const filteredTx = useMemo(() =>
    demoTransactions
      .filter(t => !month || t.monthKey === month)
      .filter(t => (q ? (t.title.toLowerCase().includes(q.toLowerCase()) || t.category.toLowerCase().includes(q.toLowerCase())) : true))
  , [month, q]);

  const kpis = useMemo(() => computeKpis(filteredTx), [filteredTx]);

  return (
    <>


      <header className="relative z-10 mx-auto flex items-center justify-between gap-4 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
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
          <select value={month} onChange={(e)=>setMonth(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-400">
            {monthOptions.map((m)=> <option key={m.key} value={m.key} className="bg-[#111318]">{m.label}</option>)}
          </select>
          <div className="relative">
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search transactions" className="rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-400" />
            <svg className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto px-6 pb-14">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard title="Balance" value={fmt(kpis.balance)} hint="Current" />
          <StatCard title="Income" value={fmt(kpis.income)} hint="This month" />
          <StatCard title="Expense" value={fmt(kpis.expense)} hint="This month" negative />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:col-span-2">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h3 className="text-sm font-medium">Income vs Expense</h3>
                <p className="text-xs text-white/60">by day</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyAgg(filteredTx)} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.7}/>
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity={0.7}/>
                      <stop offset="100%" stopColor="#f472b6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="day" stroke="#9aa0a6" tickLine={false} axisLine={false} />
                  <YAxis stroke="#9aa0a6" tickLine={false} axisLine={false} tickFormatter={(v)=>`$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} formatter={(v: number)=>[`$${v.toLocaleString()}`, ""]} />
                  <Area type="monotone" dataKey="income" stroke="#22d3ee" fill="url(#inc)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" stroke="#f472b6" fill="url(#exp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="mb-3">
              <h3 className="text-sm font-medium">Spending by Category</h3>
              <p className="text-xs text-white/60">This month</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={pieData(filteredTx)} innerRadius={46} outerRadius={76} paddingAngle={3}>
                    {categoryColors.map((c, i)=> <Cell key={i} fill={c} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" height={24} wrapperStyle={{ color: "#cbd5e1" }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number)=>`$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">Recent Transactions</h3>
              <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition hover:bg-white/10">View all</button>
            </div>
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
                  {filteredTx.slice(0, 8).map((t)=> (
                    <tr key={t.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2">{t.title}</td>
                      <td className="py-2 text-white/70">{t.category}</td>
                      <td className="py-2 text-white/60">{fmtDate(t.date)}</td>
                      <td className="py-2 text-right font-medium {t.type === 'expense' ? 'text-rose-300' : 'text-emerald-300'}">
                        <span className={t.type === 'expense' ? 'text-rose-300' : 'text-emerald-300'}>
                          {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="mb-3">
              <h3 className="text-sm font-medium">Budgets</h3>
              <p className="text-xs text-white/60">Monthly utilization</p>
            </div>
            <ul className="space-y-3 text-sm">
              {demoBudgets.map((b)=> (
                <li key={b.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-white/80">{b.name}</span>
                    <span className={b.used/b.limit > 1 ? 'text-rose-300' : 'text-white/60'}>{fmt(b.used)} / {fmt(b.limit)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className={cn('h-full', budgetColor(b.used/b.limit))} style={{ width: `${Math.min(100, (b.used/b.limit)*100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({ title, value, hint, negative }: { title: string; value: string; hint?: string; negative?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="text-xs text-white/60">{title}</div>
      <div className={cn("mt-1 text-2xl font-semibold", negative ? "text-rose-300" : "text-white")}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-white/50">{hint}</div>}
    </div>
  );
}

const monthOptions = [
  { key: monthKey(new Date()), label: formatMonth(new Date()) },
  { key: monthKey(addMonths(new Date(), -1)), label: formatMonth(addMonths(new Date(), -1)) },
  { key: monthKey(addMonths(new Date(), -2)), label: formatMonth(addMonths(new Date(), -2)) },
];

function currentMonthKey(){ return monthKey(new Date()); }
function monthKey(d: Date){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function formatMonth(d: Date){ return d.toLocaleString(undefined, { month: 'long', year: 'numeric' }); }
function addMonths(d: Date, n: number){ const x = new Date(d); x.setMonth(x.getMonth()+n); return x; }
function fmt(n: number){ return `$${n.toLocaleString()}`; }
function fmtDate(s: string){ const d = new Date(s); return d.toLocaleDateString(); }

const categoryColors = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#facc15", "#60a5fa"]; // cyan, violet, pink, emerald, amber, blue

type Tx = { id: string; title: string; amount: number; type: 'income' | 'expense'; category: string; date: string; monthKey: string };

const demoTransactions: Tx[] = [
  { id: 't1', title: 'Salary', amount: 4200, type: 'income', category: 'Salary', date: iso(1), monthKey: currentMonthKey() },
  { id: 't2', title: 'Groceries', amount: 220, type: 'expense', category: 'Food', date: iso(3), monthKey: currentMonthKey() },
  { id: 't3', title: 'Coffee', amount: 8, type: 'expense', category: 'Food', date: iso(3), monthKey: currentMonthKey() },
  { id: 't4', title: 'Transport', amount: 60, type: 'expense', category: 'Transport', date: iso(5), monthKey: currentMonthKey() },
  { id: 't5', title: 'Stocks', amount: 200, type: 'income', category: 'Investments', date: iso(7), monthKey: currentMonthKey() },
  { id: 't6', title: 'Rent', amount: 1000, type: 'expense', category: 'Housing', date: iso(1), monthKey: currentMonthKey() },
  { id: 't7', title: 'Gym', amount: 45, type: 'expense', category: 'Health', date: iso(9), monthKey: currentMonthKey() },
  { id: 't8', title: 'Dining out', amount: 58, type: 'expense', category: 'Food', date: iso(11), monthKey: currentMonthKey() },
  { id: 't9', title: 'Freelance', amount: 680, type: 'income', category: 'Freelance', date: iso(12), monthKey: currentMonthKey() },
  { id: 't10', title: 'Netflix', amount: 11, type: 'expense', category: 'Entertainment', date: iso(13), monthKey: currentMonthKey() },
];

function iso(day: number){ const d = new Date(); d.setDate(day); return d.toISOString(); }

function computeKpis(list: Tx[]){
  const income = list.filter(t=>t.type==='income').reduce((a,b)=>a+b.amount,0);
  const expense = list.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0);
  const balance = income - expense;
  return { income, expense, balance };
}

function dailyAgg(list: Tx[]){
  const byDay: Record<string, { day: string; income: number; expense: number }> = {};
  for(const t of list){
    const d = new Date(t.date).getDate();
    const key = String(d).padStart(2,'0');
    if(!byDay[key]) byDay[key] = { day: key, income: 0, expense: 0 };
    byDay[key][t.type] += t.amount;
  }
  return Object.values(byDay);
}

function pieData(list: Tx[]){
  const byCat: Record<string, number> = {};
  for(const t of list){ if(t.type==='expense') byCat[t.category] = (byCat[t.category]||0) + t.amount; }
  const entries = Object.entries(byCat).map(([name, value])=>({ name, value }));
  return entries.length ? entries : [{ name: 'No data', value: 1 }];
}

function budgetColor(ratio: number){
  if(ratio < 0.6) return 'bg-emerald-400';
  if(ratio < 0.9) return 'bg-amber-400';
  return 'bg-rose-400';
}

function cn(...c: Array<string | false | null | undefined>): string { return c.filter(Boolean).join(' '); }

const tooltipStyle = { background: 'rgba(17,19,24,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' } as const;

const demoBudgets = [
  { id: 'b1', name: 'Food', limit: 400, used: 286 },
  { id: 'b2', name: 'Transport', limit: 180, used: 92 },
  { id: 'b3', name: 'Entertainment', limit: 120, used: 69 },
  { id: 'b4', name: 'Housing', limit: 1000, used: 1000 },
];
