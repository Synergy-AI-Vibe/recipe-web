import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const getServerSupabaseClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase 공개 환경 변수가 필요합니다.");
  const cookieStore = await cookies();
  const responseHeaders: Record<string, string> = {};
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items, headers) => {
        items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        Object.assign(responseHeaders, headers);
      },
    },
  });
  return { supabase, responseHeaders };
};
