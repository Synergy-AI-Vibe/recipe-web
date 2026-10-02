import { BOOKMARK_LIMIT, createBookmarkRequestSchema } from "@recipe-web/api";
import { isYoutubeUrl } from "@/lib/is-youtube-url";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { jsonResponse, logServerError } from "@/server/api-response";
import { createBookmark, listBookmarks } from "@/server/data/bookmark";
import { getAuthenticatedUser } from "@/server/supabase/get-user";

const UNAUTHORIZED = { ok: false, reason: "unauthorized", message: "로그인이 필요해요." };
const INVALID_INPUT = { ok: false, reason: "invalid_input", message: "요청 형식이 올바르지 않아요." };
const FAILURE_STATUS = { limit: 409, duplicate: 409, error: 500 } as const;

export async function GET() {
  try {
    const { supabase, responseHeaders } = await getServerSupabaseClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return jsonResponse(UNAUTHORIZED, 401, responseHeaders);

    const items = await listBookmarks(supabase);
    return jsonResponse({ ok: true, items, count: items.length, limit: BOOKMARK_LIMIT }, 200, responseHeaders);
  } catch (error) {
    logServerError("[GET /api/bookmarks]", error);
    return jsonResponse({ ok: false, message: "북마크를 불러오지 못했어요." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, responseHeaders } = await getServerSupabaseClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) return jsonResponse(UNAUTHORIZED, 401, responseHeaders);

    const parsed = createBookmarkRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonResponse(INVALID_INPUT, 400, responseHeaders);
    if (parsed.data.sourceType === "youtube" && !isYoutubeUrl(parsed.data.sourceUrl)) {
      return jsonResponse(INVALID_INPUT, 400, responseHeaders);
    }

    const result = await createBookmark(supabase, user.id, parsed.data);
    return jsonResponse(result, result.ok ? 200 : FAILURE_STATUS[result.reason], responseHeaders);
  } catch (error) {
    logServerError("[POST /api/bookmarks]", error);
    return jsonResponse({ ok: false, reason: "error", message: "북마크를 저장하지 못했어요." }, 500);
  }
}
