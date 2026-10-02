import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const candidate = next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? new URL(next, url.origin)
    : null;
  const destination = candidate?.origin === url.origin ? candidate : new URL("/", url.origin);

  if (code) {
    const { supabase, responseHeaders } = await getServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(destination);
      Object.entries(responseHeaders).forEach(([name, value]) => response.headers.set(name, value));
      return response;
    }
  }

  return NextResponse.redirect(destination);
}
