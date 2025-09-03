import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/**
 * CategoriesPage
 * - Same frosted-glass theme
 * - Add/Edit/Delete categories (client-side demo)
 * - Fields: name, type (income/expense), color, emoji
 * - Search + filter + counters
 * Replace mock API with real endpoints when ready.
 */

// ---- Types & schema
const hexColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "expense"]),
  color: z.string().regex(hexColor, "Use a valid hex color"),
  emoji: z.string().min(1).max(2),
});

export type Category = z.infer<typeof CategorySchema>;

// Demo store (replace with API)
const initialCats: Category[] = [
  { id: "c1", name: "Salary", type: "income", color: "#22d3ee", emoji: "💼" },
  { id: "c2", name: "Food", type: "expense", color: "#f59e0b", emoji: "🍔" },
  { id: "c3", name: "Housing", type: "expense", color: "#ef4444", emoji: "🏠" },
  { id: "c4", name: "Transport", type: "expense", color: "#34d399", emoji: "🚌" },
];

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>(initialCats);
  const [editing, setEditing] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const okType = filter === "all" ? true : c.type === filter;
      const okQuery = query
        ? c.name.toLowerCase().includes(query.toLowerCase())
        : true;
      return okType && okQuery;
    });
  }, [items, filter, query]);

  const totals = useMemo(() => ({
    all: items.length,
    income: items.filter((c) => c.type === "income").length,
    expense: items.filter((c) => c.type === "expense").length,
  }), [items]);

  return (
    <div className="relative z-10 mx-auto px-6 pb-14">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-white/60">Create and manage your income & expense groups.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Tab active={filter === "all"} onClick={() => setFilter("all")}>All ({totals.all})</Tab>
            <Tab active={filter === "income"} onClick={() => setFilter("income")}>Income ({totals.income})</Tab>
            <Tab active={filter === "expense"} onClick={() => setFilter("expense")}>Expense ({totals.expense})</Tab>
          </div>
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories"
              className="rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <svg className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          </div>
        </div>
      </header>

      {/* Create form */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <h2 className="mb-3 text-sm font-medium">Add new category</h2>
        <CategoryForm
          onSubmit={(data) => {
            const id = crypto.randomUUID();
            setItems((prev) => [...prev, { ...data, id }]);
          }}
        />
      </section>

      {/* Grid list */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((c) => (
          <article key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl text-xl" style={{ background: c.color + '22', color: c.color }}>
                  {c.emoji}
                </span>
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-white/60 capitalize">{c.type}</div>
                </div>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: c.color + '22', color: c.color }}>{c.color}</span>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition hover:bg-white/10"
                onClick={() => setEditing(c)}
              >Edit</button>
              <button
                className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 backdrop-blur transition hover:bg-rose-500/20"
                onClick={() => {
                  if (confirm(`Delete ${c.name}?`)) setItems((prev) => prev.filter((x) => x.id !== c.id));
                }}
              >Delete</button>
            </div>
          </article>
        ))}
      </section>

      {editing && (
        <EditModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            setItems((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...data } : x)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

// ---- Form components
function CategoryForm({ onSubmit }: { onSubmit: (c: Omit<Category, "id">) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Omit<Category, "id">>({
    resolver: zodResolver(CategorySchema.omit({ id: true })),
    defaultValues: { name: "", type: "expense", color: "#f59e0b", emoji: "🍔" },
  });

  return (
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-5"
      onSubmit={handleSubmit(async (v) => { onSubmit(v); reset(); })}
      noValidate
    >
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs text-white/70">Name</label>
        <input className={cn(baseInput, errors.name && errorRing)} placeholder="e.g. Groceries" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs text-white/70">Type</label>
        <select className={baseInput} {...register("type")}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-white/70">Color</label>
        <input type="color" className="h-10 w-full cursor-pointer rounded-xl border border-white/10 bg-transparent p-1" {...register("color")} />
        {errors.color && <p className="mt-1 text-xs text-rose-300">{errors.color.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs text-white/70">Emoji</label>
        <input className={cn(baseInput, errors.emoji && errorRing)} placeholder="🍔" {...register("emoji")} />
      </div>
      <div className="sm:col-span-5 mt-1">
        <button disabled={isSubmitting} className="rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-medium text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110 disabled:opacity-70">
          Add Category
        </button>
      </div>
    </form>
  );
}

function EditModal({ initial, onClose, onSave }: { initial: Category; onClose: () => void; onSave: (c: Omit<Category, "id">) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Omit<Category, "id">>({
    resolver: zodResolver(CategorySchema.omit({ id: true })),
    defaultValues: { name: initial.name, type: initial.type, color: initial.color, emoji: initial.emoji },
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Edit category</h3>
          <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10">Close</button>
        </div>

        <form onSubmit={handleSubmit(async (v)=>{ onSave(v); })} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Name</label>
            <input className={cn(baseInput, errors.name && errorRing)} {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Type</label>
            <select className={baseInput} {...register("type")}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Color</label>
            <input type="color" className="h-10 w-full cursor-pointer rounded-xl border border-white/10 bg-transparent p-1" {...register("color")} />
            {errors.color && <p className="mt-1 text-xs text-rose-300">{errors.color.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Emoji</label>
            <input className={cn(baseInput, errors.emoji && errorRing)} {...register("emoji")} />
          </div>
          <div className="sm:col-span-2 mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition hover:bg-white/10">Cancel</button>
            <button disabled={isSubmitting} className="rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-medium text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110 disabled:opacity-70">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- UI utils
const baseInput = "block w-full rounded-xl border bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 shadow-inner outline-none backdrop-blur focus:ring-2 border-white/10 focus:border-transparent focus:ring-cyan-400";
const errorRing = "border-rose-400/40 focus:ring-rose-400";
function cn(...c: Array<string | false | null | undefined>): string { return c.filter(Boolean).join(" "); }

// Small pill tab
function Tab({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs",
        active ? "bg-white/10 text-cyan-300" : "text-white/70 hover:text-white hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}
