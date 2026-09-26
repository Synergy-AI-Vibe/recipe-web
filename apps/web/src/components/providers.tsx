"use client";

import type { ReactNode } from "react";
import { QueryClientProvider, QueryErrorResetBoundary } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ErrorNotification } from "@/components/error-notification";
import { getQueryClient } from "@/lib/query-client";

export const Providers = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={getQueryClient()}>
    <QueryErrorResetBoundary>{children}</QueryErrorResetBoundary>
    <ErrorNotification />
    {process.env.NODE_ENV === "development" && (
      <ReactQueryDevtools initialIsOpen={false} />
    )}
  </QueryClientProvider>
);
