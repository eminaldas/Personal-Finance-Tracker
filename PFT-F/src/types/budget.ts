import {z} from "zod";

export const CategorySchema = z.object({
      id: z.string(),
  name: z.string(),
  type: z.enum(["income", "expense"]),
  color: z.string(),
  emoji: z.string().optional().default("💸"),
})

export type Category = z.infer<typeof CategorySchema>;

export const BudgetSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  limit: z.number().nonnegative(),
  month: z.string(), // yyyy-mm
  note: z.string().optional(),
});
export type Budget = z.infer<typeof BudgetSchema>;


export const BudgetCreateSchema = BudgetSchema.pick({
  categoryId: true, limit: true, month: true, note: true,
}).partial({ note: true });

export type BudgetCreate = z.infer<typeof BudgetCreateSchema>;


export const BudgetUpdateSchema = BudgetCreateSchema.partial();
export type BudgetUpdate = z.infer<typeof BudgetUpdateSchema>;