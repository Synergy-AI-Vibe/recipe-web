import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireServerEnv } from "@/server/env";

let cachedClient: SupabaseClient | undefined;

export const getAdminSupabaseClient = (): SupabaseClient => {
  if (cachedClient) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Supabase 공개 환경 변수가 필요합니다.");
  cachedClient = createClient(url, requireServerEnv("SUPABASE_SECRET_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
};
