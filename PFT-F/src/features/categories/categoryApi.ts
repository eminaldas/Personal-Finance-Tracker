import { apiFetch, getJSON, postJSON } from "../../lib/api";

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  emoji: string;
};

export type CategoryCreate = Omit<Category, "id">;

export async function listCategories(): Promise<Category[]> {
  return getJSON<Category[]>("/categories");
}

export async function createCategory(input: CategoryCreate): Promise<Category> {
  return postJSON<Category>("/categories", input);
}

 export async function deleteCategory(id: string): Promise<{id:string}> {
  const res = await apiFetch(`/categories/${id}`, { method: "DELETE" });
  if(!res.ok) throw new Error(await res.text())
  return res.json()
}
