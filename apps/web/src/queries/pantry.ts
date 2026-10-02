import { useMutation } from "@tanstack/react-query";
import { searchPantry } from "@recipe-web/api";
import { getApiClient } from "@/lib/api-client";

export const useSearchPantry = () =>
  useMutation({
    mutationFn: (ingredients: string[]) => searchPantry(getApiClient(), ingredients),
    meta: { errorMode: "local" },
  });
