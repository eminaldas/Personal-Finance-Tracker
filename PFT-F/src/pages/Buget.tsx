import React, { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Budget tipleri (senin types/budget.ts'tan)
export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string; // hex
  emoji: string;
};

export type Budget = {
  id: string;
  categoryId: string;
  limit: number; // monthly limit (positive)
  month: string; // yyyy-mm (current month by default)
  note?: string;
};

// --- API HOOKLARI ---
// budgets
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from "../features/budget";
// categories (min. API/hook aşağıda)
import { useCategories, useCreateCategory } from "../features/categories";

const BudgetSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Pick a category"),
  limit: z.number().positive("Limit must be > 0"),
  month: z.string().min(7, "Select month"),
  note: z.string().max(160).optional(),
});
type BudgetForm = z.infer<typeof BudgetSchema>;

const CategorySchema = z.object({
  name: z.string().min(1, "Required"),
  type: z.enum(["income", "expense"]),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Hex color, e.g. #22d3ee"),
  emoji: z.string().min(1).max(2),
});
type NewCategory = z.infer<typeof CategorySchema>;

// utils
function ym(date = new Date()): string {
  return date.toISOString().slice(0, 7); // yyyy-mm
}
function cn(...c: Array<string | false | null | undefined>): string {
  return c.filter(Boolean).join(" ");
}

const baseInput =
  "block w-full rounded-xl border bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 shadow-inner outline-none backdrop-blur focus:ring-2 border-white/10 focus:border-transparent focus:ring-cyan-400";
const errorRing = "border-rose-400/40 focus:ring-rose-400";

export default function BudgetsPage() {
  const [editing, setEditing] = useState<Budget | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [month, setMonth] = useState<string>(ym());

  // --- DATA HOOKLARI ---
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const {
    data: budgets = [],
    isLoading: budgetLoading,
    error: budgetErr,
  } = useBudgets(month);

  // mutations
  const createBudget = useCreateBudget(month);
  const updateBudget = useUpdateBudget(month);
  const deleteBudget = useDeleteBudget(month);
  const createCategory = useCreateCategory();

  // harcama (spent) şimdilik API’den gelmiyorsa 0; ileride transactions agg ile doldur
  const list = useMemo(() => {
    return budgets
      .map((b) => ({
        ...b,
        category: categories.find((c) => c.id === b.categoryId),
        spent: 0, // TODO: backend'den geliyorsa burada b.spent kullan
      }))
      .filter((row) => !!row.category)
      .filter((row) =>
        filterType === "all" ? true : row.category!.type === filterType
      )
      .filter((row) =>
        search
          ? row.category!.name.toLowerCase().includes(search.toLowerCase())
          : true
      );
  }, [budgets, categories, filterType, search]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BudgetForm>({
    resolver: zodResolver(BudgetSchema),
    defaultValues: { categoryId: "", limit: 0, month: ym(), note: "" },
  });

  const onSubmit = async (v: BudgetForm) => {
    await createBudget.mutateAsync({
      categoryId: v.categoryId,
      limit: v.limit,
      month: v.month,
      note: v.note,
    });
    reset({ categoryId: "", limit: 0, month, note: "" });
  };

  if (catLoading || budgetLoading) {
    return (
      <div className="p-6 text-sm text-white/70">Veriler yükleniyor…</div>
    );
  }
  if (budgetErr) {
    return (
      <div className="p-6 text-sm text-rose-300">
        Hata: {(budgetErr as Error).message}
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto px-6 pb-14">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Budgets</h1>
          <p className="text-sm text-white/60">
            Set monthly limits for categories and track your usage.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Tab active={filterType === "all"} onClick={() => setFilterType("all")}>
              All
            </Tab>
            <Tab
              active={filterType === "income"}
              onClick={() => setFilterType("income")}
            >
              Income
            </Tab>
            <Tab
              active={filterType === "expense"}
              onClick={() => setFilterType("expense")}
            >
              Expense
            </Tab>
          </div>
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category"
              className="rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-white/40 backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <svg
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
      </header>

      {/* Create form */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <h2 className="mb-3 text-sm font-medium">Add new budget</h2>
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-6"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Category</label>
            <select
              className={cn(
                baseInput,
                "appearance-none pr-8 bg-gray-900",
                errors.categoryId && errorRing
              )}
              {...register("categoryId", {
                onChange: (e) => {
                  if (e.target.value === "__new__") {
                    setShowCatModal(true);
                    setValue("categoryId", "");
                  }
                },
              })}
            >
              <option className="bg-gray-900" value="">Select category</option>
              {categories.map((c) => (
                <option className="bg-gray-900" key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
              <option className="bg-gray-900" value="__new__">+ Add new category…</option>
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-rose-300">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/70">Month</label>
            <input
              type="month"
              className={cn(baseInput, errors.month && errorRing)}
              {...register("month")}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/70">Limit</label>
            <Controller
              control={control}
              name="limit"
              render={({ field }) => (
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={cn(baseInput, errors.limit && errorRing)}
                  placeholder="0.00"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              )}
            />
            {errors.limit && (
              <p className="mt-1 text-xs text-rose-300">
                {errors.limit.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-white/70">
              Note (optional)
            </label>
            <input
              className={cn(baseInput, errors.note && errorRing)}
              placeholder="Short note"
              {...register("note")}
            />
          </div>

          <div className="md:col-span-6 mt-1">
            <button
              disabled={isSubmitting || createBudget.isPending}
              className="rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-medium text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110 disabled:opacity-70"
            >
              Add Budget
            </button>
          </div>
        </form>
      </section>

      {/* List */}
      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((row) => {
          const pct =
            row.limit > 0
              ? Math.min(100, Math.round((row.spent / row.limit) * 100))
              : 0;
          const bar =
            pct >= 100
              ? "bg-rose-500"
              : pct >= 80
              ? "bg-amber-400"
              : "bg-emerald-400";
          return (
            <article
              key={row.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
            >
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-xl text-xl"
                    style={{
                      background: row.category!.color + "22",
                      color: row.category!.color,
                    }}
                    aria-hidden
                  >
                    {row.category!.emoji}
                  </span>
                  <div>
                    <div className="text-sm font-medium">
                      {row.category!.name}
                    </div>
                    <div className="text-xs text-white/60">{row.month}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                    onClick={() =>
                      setEditing({
                        id: row.id,
                        categoryId: row.categoryId,
                        limit: row.limit,
                        month: row.month,
                        note: row.note,
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20"
                    onClick={() => deleteBudget.mutate(row.id)}
                  >
                    Delete
                  </button>
                </div>
              </header>

              <div className="mt-4">
                <div className="flex items-baseline justify-between text-sm">
                  <div className="text-white/70">Spent</div>
                  <div>
                    <span className="text-white">
                      ${row.spent.toLocaleString()}
                    </span>{" "}
                    / ${row.limit.toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-right text-xs text-white/60">
                  {pct}% used
                </div>
              </div>

              {pct >= 100 && (
                <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-xs text-rose-200">
                  You exceeded this budget.
                </p>
              )}
              {pct >= 80 && pct < 100 && (
                <p className="mt-3 rounded-lg border border-amber-300/30 bg-amber-400/10 p-2 text-xs text-amber-200">
                  Warning: more than 80% used.
                </p>
              )}
            </article>
          );
        })}
      </section>

      {/* Edit Modal */}
      {editing && (
        <EditBudgetModal
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={async (upd) => {
            await updateBudget.mutateAsync({ id: editing.id, input: upd });
            setEditing(null);
          }}
        />
      )}

      {/* Quick Add Category */}
      {showCatModal && (
        <QuickCategoryModal
          onClose={() => setShowCatModal(false)}
          onCreate={async (data) => {
            const created = await createCategory.mutateAsync(data);
            // formda hemen seçili yap
            setValue("categoryId", created.id);
            setShowCatModal(false);
          }}
        />
      )}
    </div>
  );
}

// Modals
function EditBudgetModal({
  initial,
  onClose,
  onSave,
  categories,
}: {
  initial: Budget;
  onClose: () => void;
  onSave: (v: Omit<Budget, "id">) => void | Promise<void>;
  categories: Category[];
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetForm>({
    resolver: zodResolver(BudgetSchema),
    defaultValues: { ...initial },
  });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Edit budget</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <form
          onSubmit={handleSubmit(async (v) => {
            const { id, ...rest } = v;
            await onSave(rest as Omit<Budget, "id">);
          })}
          noValidate
          className="grid grid-cols-1 gap-3"
        >
          <div>
            <label className="mb-1 block text-xs text-white/70">Category</label>
            <select className={cn(baseInput, errors.categoryId && errorRing)} {...register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Month</label>
            <input
              type="month"
              className={cn(baseInput, errors.month && errorRing)}
              {...register("month")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Limit</label>
            <Controller
              control={control}
              name="limit"
              render={({ field }) => (
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={cn(baseInput, errors.limit && errorRing)}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              )}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Note</label>
            <input className={cn(baseInput, errors.note && errorRing)} {...register("note")} />
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-medium text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110 disabled:opacity-70"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickCategoryModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (v: NewCategory) => void | Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewCategory>({
    resolver: zodResolver(CategorySchema),
    defaultValues: { name: "", type: "expense", color: "#f59e0b", emoji: "🍔" },
  });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">New category</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <form
          onSubmit={handleSubmit(async (v) => onCreate(v))}
          noValidate
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Name</label>
            <input
              className={cn(baseInput, errors.name && errorRing)}
              {...register("name")}
              placeholder="e.g. Groceries"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-300">
                {errors.name.message}
              </p>
            )}
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
            <input
              type="color"
              className="h-10 w-full cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
              {...register("color")}
            />
            {errors.color && (
              <p className="mt-1 text-xs text-rose-300">
                {errors.color.message}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Emoji</label>
            <input
              className={cn(baseInput, errors.emoji && errorRing)}
              {...register("emoji")}
              placeholder="🍔"
            />
          </div>
          <div className="sm:col-span-2 mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-medium text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110 disabled:opacity-70"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Small tab pill used in header filters */
function Tab({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl px-3 py-1.5 text-xs",
        active
          ? "bg-white text-black"
          : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}
