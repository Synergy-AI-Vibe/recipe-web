import { createBrowserClient } from "@supabase/ssr";

export const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase 공개 환경 변수가 필요합니다.");
  return createBrowserClient(url, key);
};
