import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, isApiRequestCanceled } from "@recipe-web/api";
import { notifyError } from "@/lib/error-notification";

type QueryErrorMode = "local" | "notify" | "boundary";

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: { errorMode?: QueryErrorMode };
    mutationMeta: { errorMode?: "local" };
  }
}

const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isApiRequestCanceled(error)) return;

        // A failed refresh still has usable data, so keep it visible and notify.
        if (query.state.data !== undefined || query.meta?.errorMode === "notify") {
          notifyError(error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _result, mutation) => {
        if (mutation.meta?.errorMode !== "local") {
          notifyError(error);
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: typeof window === "undefined" ? Infinity : 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        throwOnError: (error, query) =>
          query.meta?.errorMode === "boundary" &&
          query.state.data === undefined &&
          !isApiRequestCanceled(error),
        retry: (failureCount, error) => {
          if (failureCount >= 1 || !(error instanceof ApiError)) return false;

          return (
            error.kind === "network" ||
            error.kind === "timeout" ||
            (error.kind === "http" &&
              error.status !== undefined &&
              error.status >= 500 &&
              error.status < 600)
          );
        },
      },
      mutations: {
        retry: false,
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

export const getQueryClient = () => {
  if (typeof window === "undefined") return createQueryClient();

  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
};
