import { getServerSupabaseClient } from "@/lib/supabase/server";
import { jsonResponse, logServerError } from "@/server/api-response";
import { deleteBookmark } from "@/server/data/bookmark";
import { getAuthenticatedUser } from "@/server/supabase/get-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const bookmarkId = Number(id);
  if (!Number.isInteger(bookmarkId) || bookmarkId <= 0) {
    return jsonResponse({ ok: false, message: "잘못된 요청이에요." }, 400);
  }

  try {
    const { supabase, responseHeaders } = await getServerSupabaseClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return jsonResponse({ ok: false, reason: "unauthorized", message: "로그인이 필요해요." }, 401, responseHeaders);
    }

    await deleteBookmark(supabase, bookmarkId);
    return jsonResponse({ ok: true }, 200, responseHeaders);
  } catch (error) {
    logServerError("[DELETE /api/bookmarks/:id]", error);
    return jsonResponse({ ok: false, message: "삭제하지 못했어요." }, 500);
  }
}
