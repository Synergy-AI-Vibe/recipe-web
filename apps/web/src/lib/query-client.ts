import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@recipe-web/api";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: typeof window === "undefined" ? Infinity : 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
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
