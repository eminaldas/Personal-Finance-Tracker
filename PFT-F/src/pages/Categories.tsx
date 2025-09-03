import { useMemo, useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { useCategories, useCreateCategory, useDeleteCategory } from "../features/categories"; // dosya adını senin yapına göre ayarla
import type { Category } from "../features/categories"; // sunucudaki tip


const hexColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "expense"]),
  color: z.string().regex(hexColor, "Use a valid hex color"),
  emoji: z.string().min(1).max(2),
});
type FormCategory = z.infer<typeof CategorySchema>;
type FormCategoryCreate = Omit<FormCategory, "id">;

export default function CategoriesPage() {
  const qc = useQueryClient();

  // --- Server state
  const { data: items, isLoading, isError, error } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  // --- UI state
  const [editing, setEditing] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  // --- Derived
  const list = items ?? [];

  const filtered = useMemo(() => {
    return list.filter((c) => {
      const okType = filter === "all" ? true : c.type === filter;
      const okQuery = query ? c.name.toLowerCase().includes(query.toLowerCase()) : true;
      return okType && okQuery;
    });
  }, [list, filter, query]);

  const totals = useMemo(
    () => ({
      all: list.length,
      income: list.filter((c) => c.type === "income").length,
      expense: list.filter((c) => c.type === "expense").length,
    }),
    [list]
  );

  const patchCategoryInCache = (id: string, patch: Omit<Category, "id">) => {
    qc.setQueryData<Category[]>(["categories"], (prev) =>
      (prev ?? []).map((x) => (x.id === id ? { ...x, ...patch } as Category : x))
    );
  };

  const removeCategoryFromCache = (id: string) => {
   deleteCategory.mutate(id);
  };

  // --- UI states for fetch
  if (isLoading) {
    return (
      <div className="relative z-10 mx-auto px-6 pb-14">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-white/60">Loading your categories…</p>
        </header>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="animate-pulse h-5 w-1/3 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="relative z-10 mx-auto px-6 pb-14">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-rose-300">
            Something went wrong while fetching categories.
          </p>
          {error instanceof Error && (
            <p className="mt-2 text-xs text-white/60">{error.message}</p>
          )}
        </header>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto px-6 pb-14">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-white/60">Create and manage your income & expense groups.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Tab active={filter === "all"} onClick={() => setFilter("all")}>
              All ({totals.all})
            </Tab>
            <Tab active={filter === "income"} onClick={() => setFilter("income")}>
              Income ({totals.income})
            </Tab>
            <Tab active={filter === "expense"} onClick={() => setFilter("expense")}>
              Expense ({totals.expense})
            </Tab>
          </div>
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories"
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
        </div>
      </header>

      {/* Create form (gerçek API) */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <h2 className="mb-3 text-sm font-medium">Add new category</h2>
        <CategoryForm
          onSubmit={(data) => {
            // Optimistic: geçici id ile cache’e ekleyip sonra server sonucu ile sync
            const tempId = `temp-${Date.now()}`;
            qc.setQueryData<Category[]>(["categories"], (prev) => [
              ...(prev ?? []),
              { id: tempId, ...data },
            ]);

            createCategory.mutate(data, {
              onError: () => {
                // rollback
                qc.setQueryData<Category[]>(["categories"], (prev) =>
                  (prev ?? []).filter((c) => c.id !== tempId)
                );
              },
              onSuccess: (serverItem) => {
                // temp’i gerçek kayıtla değiştir (flicker’ı azaltır)
                qc.setQueryData<Category[]>(["categories"], (prev) =>
                  (prev ?? []).map((c) => (c.id === tempId ? serverItem : c))
                );
              },
            });
          }}
          submitting={createCategory.isPending}
        />
      </section>

      {/* Grid list */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((c) => (
          <article key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl text-xl"
                  style={{ background: c.color + "22", color: c.color }}
                >
                  {c.emoji}
                </span>
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-white/60 capitalize">{c.type}</div>
                </div>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{ background: c.color + "22", color: c.color }}
              >
                {c.color}
              </span>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition hover:bg-white/10"
                onClick={() => setEditing(c)}
              >
                Edit
              </button>
              <button
                className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 backdrop-blur transition hover:bg-rose-500/20"
                onClick={() => {
                  if (confirm(`Delete ${c.name}?`)) {
                    
                    removeCategoryFromCache(c.id);
      
                  }
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>

      {editing && (
        <EditModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            // Şimdilik cache’te güncelle
            patchCategoryInCache(editing.id, data);
            setEditing(null);
            // TODO: updateCategory API geldiğinde mutate + onError rollback + onSuccess invalidate
          }}
        />
      )}
    </div>
  );
}

// ---- Form components
function CategoryForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (c: FormCategoryCreate) => void;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormCategoryCreate>({
    resolver: zodResolver(CategorySchema.omit({ id: true })),
    defaultValues: { name: "", type: "expense", color: "#f59e0b", emoji: "🍔" },
  });

  const disabled = submitting || isSubmitting;
  const emojiValue = watch("emoji");

  return (
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-5"
      onSubmit={handleSubmit(async (v) => {
        onSubmit(v);
        reset();
      })}
      noValidate
    >
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs text-white/70">Name</label>
        <input
          className={cn(baseInput, errors.name && errorRing)}
          placeholder="e.g. Groceries"
          {...register("name")}
        />
        {errors.name && <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs text-white/70">Type</label>
        <select className={baseInput} {...register("type")}>
          <option className="text-gray-500" value="expense">Expense</option>
          <option  className="text-gray-500" value="income">Income</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-white/70">Color</label>
        <input
          type="color"
          className="h-10 w-full cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
          {...register("color")}
        />
        {errors.color && <p className="mt-1 text-xs text-rose-300">{errors.color.message}</p>}
      </div>

      {/* EMOJI DROPDOWN */}
      <div>
        <label className="mb-1 block text-xs text-white/70">Emoji</label>
        <EmojiDropdown
          value={emojiValue}
          onChange={(emj) => setValue("emoji", emj, { shouldDirty: true, shouldValidate: true })}
          disabled={disabled}
        />
        {/* form state için gizli input (validation & submit’te yer alması için) */}
        <input type="hidden" {...register("emoji")} />
        {errors.emoji && <p className="mt-1 text-xs text-rose-300">{errors.emoji.message}</p>}
      </div>

      <div className="sm:col-span-5 mt-1">
        <button
          disabled={disabled}
          className="rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-medium text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110 disabled:opacity-70"
        >
          Add Category
        </button>
      </div>
    </form>
  );
}

function EditModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Category;
  onClose: () => void;
  onSave: (c: Omit<Category, "id">) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<Omit<Category, "id">>({
    resolver: zodResolver(CategorySchema.omit({ id: true })),
    defaultValues: {
      name: initial.name,
      type: initial.type,
      color: initial.color,
      emoji: initial.emoji,
    },
  });

  const emojiValue = watch("emoji");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Edit category</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={handleSubmit(async (v) => {
            onSave(v);
          })}
          noValidate
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Name</label>
            <input className={cn(baseInput, errors.name && errorRing)} {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Type</label>
            <select className={baseInput } {...register("type")}>
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
            {errors.color && <p className="mt-1 text-xs text-rose-300">{errors.color.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-white/70">Emoji</label>
            <EmojiDropdown
              value={emojiValue}
              onChange={(emj) => setValue("emoji", emj, { shouldDirty: true, shouldValidate: true })}
              disabled={isSubmitting}
            />
            <input type="hidden" {...register("emoji")} />
            {errors.emoji && <p className="mt-1 text-xs text-rose-300">{errors.emoji.message}</p>}
          </div>

          <div className="sm:col-span-2 mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition hover:bg-white/10"
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

/* ---------- Emoji Dropdown Component ---------- */

const EMOJIS = [
  "😀","😃","😄","😁","😆","🥹","😊","🙂","😉","😍","😘","😎","🤓",
  "🤩","🥳","🤔","😴","😇","😅","😭","😱","🤯","🤗","🫶","👍","👎",
  "💼","💸","💳","🏦","🏠","🚗","🚌","🍔","🍕","🍟","🍜","☕️","🍺",
  "🛍️","🎁","🧾","🛒","💊","⚽️","💡","🧰","🧹","🧺","🌮","🥗"
];

function EmojiDropdown({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange: (emoji: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // dışarı tıklayınca kapan
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const filtered = useMemo(() => {
    if (!q.trim()) return EMOJIS;
    const lower = q.toLowerCase();
    // çok basit filtre: şimdilik sadece benzerleri döndür
    return EMOJIS.filter((e) => e.toLowerCase().includes(lower));
  }, [q]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm text-white backdrop-blur",
          "border-white/10 bg-white/5 focus:ring-2 focus:ring-cyan-400",
          disabled && "opacity-70 cursor-not-allowed"
        )}
      >
        <span className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-xl">
            {value || "🙂"}
          </span>
          <span className="text-white/70">{value ? "Change emoji" : "Pick emoji"}</span>
        </span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="listbox"
          className="absolute z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur-xl shadow-xl"
        >
          <div className="mb-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search emoji…"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 overflow-visible"
            />
          </div>
          <div className="max-h-56 overflow-auto pr-1">
            <div className="grid grid-cols-8 gap-1">
              {filtered.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    onChange(e);
                    setOpen(false);
                    setQ("");
                    // focus geri butona
                    queueMicrotask(() => btnRef.current?.focus());
                  }}
                  className="grid h-8 w-8 place-items-center rounded-md border border-transparent text-lg transition hover:bg-white/10 hover:border-white/10"
                  aria-label={`Pick emoji ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- UI utils
const baseInput =
  "block w-full rounded-xl border bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 shadow-inner outline-none backdrop-blur focus:ring-2 border-white/10 focus:border-transparent focus:ring-cyan-400";
const errorRing = "border-rose-400/40 focus:ring-rose-400";
function cn(...c: Array<string | false | null | undefined>): string {
  return c.filter(Boolean).join(" ");
}

// Small pill tab
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
        active ? "bg-white/10 text-cyan-300" : "text-white/70 hover:text-white hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}
