import type { SupabaseClient } from "@supabase/supabase-js";
import { vi } from "vitest";

type QueryResult = { data?: unknown; error?: { code?: string; message: string } | null };
type TestUser = { id: string; email: string };

export const TEST_USER: TestUser = { id: "user-1", email: "user@example.test" };

export const createFakeSupabase = (options: { user?: TestUser | null; result?: QueryResult } = {}) => {
  const { user = TEST_USER, result = { data: [], error: null } } = options;

  const query = {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(async () => result),
    then: (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  (["select", "insert", "delete", "eq", "order"] as const).forEach((name) => query[name].mockReturnValue(query));

  const auth = {
    getUser: vi.fn(async () =>
      user
        ? { data: { user }, error: null }
        : { data: { user: null }, error: { message: "Auth session missing!" } },
    ),
    signOut: vi.fn(async () => ({ error: null })),
  };
  const from = vi.fn(() => query);

  return { supabase: { auth, from } as unknown as SupabaseClient, query, auth, from };
};

export const NO_STORE = "private, no-cache, no-store, must-revalidate, max-age=0";
