import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCategories, createCategory, deleteCategory } from "./categoryApi";
import type { Category, CategoryCreate } from "./categoryApi";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: listCategories,
    staleTime: 5 * 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryCreate) => createCategory(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}


export function useDeleteCategory() {
  const qc = useQueryClient();

  const removeCategoryFromCache = (id: string) => {
    qc.setQueryData<Category[]>(["categories"], (prev) =>
      (prev ?? []).filter((x) => x.id !== id)
    );
  };

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["categories"] });
      removeCategoryFromCache(id); // hemen UI’dan sil
    },

    onError: (_err, _id, _ctx) => {
      qc.invalidateQueries({ queryKey: ["categories"] }); // rollback için server’dan çek
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] }); // doğrulama için server’dan çek
    },
  });
}

