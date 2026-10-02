import { useMutation, useQuery } from "@tanstack/react-query";
import { analyzeRecipe, type AnalyzeRequest } from "@recipe-web/api";
import { getApiClient } from "@/lib/api-client";

export const analyzeQueryKeys = {
  byUrl: (url: string) => ["analyze", { url }] as const,
};

export const useAnalyzeRecipe = () =>
  useMutation({
    mutationFn: (input: AnalyzeRequest) => analyzeRecipe(getApiClient(), input),
    meta: { errorMode: "local" },
  });

export const useAnalyzeByUrl = (url: string | null, enabled: boolean) =>
  useQuery({
    queryKey: analyzeQueryKeys.byUrl(url ?? ""),
    queryFn: () => analyzeRecipe(getApiClient(), { type: "youtube", url: url ?? "" }),
    enabled: enabled && url !== null,
    retry: false,
    gcTime: 0,
    meta: { errorMode: "local" },
  });
