import { useMutation } from "@tanstack/react-query";
import { analyzeRecipe, type AnalyzeRequest } from "@recipe-web/api";
import { getApiClient } from "@/lib/api-client";

export const useAnalyzeRecipe = () =>
  useMutation({
    mutationFn: (input: AnalyzeRequest) => analyzeRecipe(getApiClient(), input),
    meta: { errorMode: "local" },
  });
