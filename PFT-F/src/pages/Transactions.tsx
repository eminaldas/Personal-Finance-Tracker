import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/* ==== API hooks & types ==== */
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "../features/transactions/transactionsHooks";
import type { Tx } from "../types/transactions";
import {
  useCategories,
  useCreateCategory,
} from "../features/categories/categoryHooks";

/* ========= Schemas & Types ========= */

const TransactionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"), // string->number coercion
  categoryId: z.string().min(1, "Select a category"),
  date: z.string().min(1, "Select a date"),
  note: z.string().max(200).optional(),
});

type TxFormIn = z.input<typeof TransactionSchema>;   // amount: unknown/string/number
type TxFormOut = z.output<typeof TransactionSchema>; // amount: number

export type Category = {
  id: number; // backend int
  name: string;
  type: "income" | "expense";
  color: string;
  emoji: string;
};

/* ========= Utils ========= */

function today(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
function fmt(n: number) {
  return `$${n.toLocaleString()}`;
}
function fmtDate(s: string) {
  // Safari issues: add T00:00:00
  return new Date(s + "T00:00:00").toLocaleDateString();
}
const baseInput =
  "block w-full rounded-xl border bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 shadow-inner outline-none backdrop-blur focus:ring-2 border-white/10 focus:border-transparent focus:ring-cyan-400";
const errorRing = "border-rose-400/40 focus:ring-rose-400";
function cn(...c: Array<string | false | null | undefined>): string {
  return c.filter(Boolean).join(" ");
}

/* ========= Page ========= */

export default function TransactionsPage() {
  // Categories (API)
  const { data: categoriesData } = useCategories();
  const createCategory = useCreateCategory();
  const categories: Category[] = (categoriesData ?? []) as any;

  // Transactions (API)
  const { data: txs = [], isLoading } = useTransactions(); // gerekirse tarih aralığı parametreleri verilebilir
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const [editing, setEditing] = useState<Tx | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [filterCat, setFilterCat] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "date-desc" | "date-asc" | "amount-desc" | "amount-asc"
  >("date-desc");

  const filtered = useMemo(() => {
    let list = [...txs];

    if (filterType !== "all") list = list.filter((t) => t.type === filterType);
    if (filterCat) list = list.filter((t) => String(t.categoryId) === filterCat);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        return (
          t.title.toLowerCase().includes(q) ||
          (cat?.name.toLowerCase() ?? "").includes(q)
        );
      });
    }

    list.sort((a, b) => {
      if (sortBy === "date-desc") return b.date.localeCompare(a.date);
      if (sortBy === "date-asc") return a.date.localeCompare(b.date);
      if (sortBy === "amount-desc") return b.amount - a.amount;
      return a.amount - b.amount;
    });
    return list;
  }, [txs, filterType, filterCat, search, sortBy, categories]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TxFormIn, any, TxFormOut>({
    resolver: zodResolver(TransactionSchema),
    defaultValues: {
      title: "",
      amount: 0,
      categoryId: "",
      date: today(),
      note: "",
    } satisfies TxFormIn,
  });

  const onSubmit = async (v: TxFormOut) => {
    await createTx.mutateAsync({
      title: v.title,
      amount: v.amount, // number garanti
      categoryId: Number(v.categoryId),
      date: v.date,
      note: v.note || null,
    });
    reset({ title: "", amount: 0, categoryId: "", date: today(), note: "" });
  };

  return (
    <div className="relative z-10 mx-auto px-6 pb-14">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-sm text-white/60">
            Add incomes & expenses. Use filters to analyze your spending.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Tab
              active={filterType === "all"}
              onClick={() => setFilterType("all")}
            >
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
              placeholder="Search title or category"
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
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="date-desc">Newest</option>
            <option value="date-asc">Oldest</option>
            <option value="amount-desc">Amount ↓</option>
            <option value="amount-asc">Amount ↑</option>
          </select>
        </div>
      </header>

      {/* Create form */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <h2 className="mb-3 text-sm font-medium">Add new transaction</h2>
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-7"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Title</label>
            <input
              className={cn(baseInput, errors.title && errorRing)}
              placeholder="e.g. Grocery"
              {...register("title")}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-300">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/70">Amount</label>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className={cn(baseInput, errors.amount && errorRing)}
                  placeholder="0.00"
                  value={isNaN(field.value as number) ? "" : (field.value as number)}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              )}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-rose-300">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/70">Date</label>
            <input
              type="date"
              className={cn(baseInput, errors.date && errorRing)}
              {...register("date")}
            />
            {errors.date && (
              <p className="mt-1 text-xs text-rose-300">{errors.date.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Category</label>
            <select
              className={cn(baseInput, errors.categoryId && errorRing)}
              {...register("categoryId", {
                onChange: async (e) => {
                  const val = e.target.value;
                  if (val === "__new__") {
                    setShowCatModal(true);
                    // seçimi temizle
                    setValue("categoryId", "");
                  }
                },
              })}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.emoji} {c.name}
                </option>
              ))}
              <option value="__new__">+ Add new category…</option>
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-rose-300">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="md:col-span-7">
            <label className="mb-1 block text-xs text-white/70">
              Note (optional)
            </label>
            <textarea
              rows={2}
              className={cn(baseInput, errors.note && errorRing)}
              placeholder="Short note"
              {...register("note")}
            />
          </div>

          <div className="md:col-span-7 mt-1 flex flex-wrap items-center gap-2">
            <button
              disabled={isSubmitting || createTx.isPending}
              className="rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-medium text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110 disabled:opacity-70"
>
              {createTx.isPending ? "Saving…" : "Add Transaction"}
            </button>
            <span className="text-xs text-white/60">
              Amounts are stored positive; the sign comes from the category
              type.
            </span>
          </div>
        </form>
      </section>

      {/* List */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">
            All Transactions ({filtered.length})
          </h3>
        </div>
        {isLoading ? (
          <div className="p-3 text-white/70">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-white/60">
                <tr className="border-b border-white/10">
                  <th className="py-2 font-medium">Title</th>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium">Category</th>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium text-right">Amount</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-2">{t.title}</td>
                      <td className="py-2 capitalize text-white/70">{t.type}</td>
                      <td className="py-2 text-white/70">
                        <span className="inline-flex items-center gap-1">
                          <span>{cat?.emoji}</span>
                          <span>{cat?.name}</span>
                        </span>
                      </td>
                      <td className="py-2 text-white/60">{fmtDate(t.date)}</td>
                      <td className="py-2 text-right">
                        <span
                          className={
                            t.type === "expense"
                              ? "text-rose-300"
                              : "text-emerald-300"
                          }
                        >
                          {t.type === "expense" ? "-" : "+"}
                          {fmt(t.amount)}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                            onClick={() => setEditing(t)}
                          >
                            Edit
                          </button>
                          <button
                            disabled={deleteTx.isPending}
                            className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20"
                            onClick={() => {
                              if (confirm("Delete this transaction?")) {
                                deleteTx.mutate(t.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit Modal */}
      {editing && (
        <TxEditModal
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={async (upd) => {
            await updateTx.mutateAsync({
              id: editing.id,
              data: {
                title: upd.title,
                amount: upd.amount,
                categoryId: upd.categoryId,
                date: upd.date,
                note: upd.note ?? null,
              },
            });
            setEditing(null);
          }}
        />
      )}

      {/* Quick Add Category */}
      {showCatModal && (
        <QuickCategoryModal
          onClose={() => setShowCatModal(false)}
          onCreate={async (data) => {
            const created = await createCategory.mutateAsync({
              name: data.name,
              type: data.type,
              color: data.color,
              emoji: data.emoji,
            });
            setValue("categoryId", String(created.id));
            setShowCatModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ========= Modals ========= */

function TxEditModal({
  initial,
  onClose,
  onSave,
  categories,
}: {
  initial: Tx;
  onClose: () => void;
  onSave: (v: Omit<Tx, "id" | "type">) => void;
  categories: Category[];
}) {
  const EditSchema = TransactionSchema.extend({
    categoryId: z.string().min(1),
  });
  type EditIn = z.input<typeof EditSchema>;
  type EditOut = z.output<typeof EditSchema>;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditIn, any, EditOut>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      id: String(initial.id),
      title: initial.title,
      amount: initial.amount,
      categoryId: String(initial.categoryId),
      date: initial.date,
      note: initial.note ?? "",
    } satisfies EditIn,
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Edit transaction</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-7"
          onSubmit={handleSubmit(async (v: EditOut) => {
            const payload = {
              title: v.title,
              amount: v.amount,
              categoryId: Number(v.categoryId),
              date: v.date,
              note: v.note ?? null,
            };
            onSave(payload as any);
          })}
          noValidate
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Title</label>
            <input className={cn(baseInput, errors.title && errorRing)} {...register("title")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Amount</label>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className={cn(baseInput, errors.amount && errorRing)}
                  value={isNaN(field.value as number) ? "" : (field.value as number)}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              )}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Date</label>
            <input type="date" className={cn(baseInput, errors.date && errorRing)} {...register("date")} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Category</label>
            <select className={cn(baseInput, errors.categoryId && errorRing)} {...register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-7">
            <label className="mb-1 block text-xs text-white/70">Note</label>
            <textarea rows={2} className={cn(baseInput, errors.note && errorRing)} {...register("note")} />
          </div>
          <div className="md:col-span-7 mt-1 flex justify-end gap-2">
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
  onCreate: (v: {
    name: string;
    type: "income" | "expense";
    color: string;
    emoji: string;
  }) => void;
}) {
  const CategorySchema = z.object({
    name: z.string().min(1, "Required"),
    type: z.enum(["income", "expense"]),
    color: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Hex color, e.g. #22d3ee"),
    emoji: z.string().min(1).max(2),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof CategorySchema>>({
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

/* ========= Small UI bits ========= */

function Tab({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs",
        active
          ? "bg-white/10 text-cyan-300"
          : "text-white/70 hover:text-white hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}
