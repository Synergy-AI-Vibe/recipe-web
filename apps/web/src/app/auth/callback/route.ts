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
    const supabase = await getServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(destination);
  }

  return NextResponse.redirect(destination);
}
