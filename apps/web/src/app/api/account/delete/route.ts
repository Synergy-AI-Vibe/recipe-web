import { getServerSupabaseClient } from "@/lib/supabase/server";
import { jsonResponse, logServerError } from "@/server/api-response";
import { getAdminSupabaseClient } from "@/server/supabase/admin";
import { getAuthenticatedUser } from "@/server/supabase/get-user";

export async function POST() {
  try {
    const { supabase, responseHeaders } = await getServerSupabaseClient();
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      return jsonResponse({ ok: false, reason: "unauthorized", message: "로그인이 필요해요." }, 401, responseHeaders);
    }

    const { error } = await getAdminSupabaseClient().auth.admin.deleteUser(user.id);
    if (error) throw new Error(error.message);

    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return jsonResponse({ ok: true }, 200, responseHeaders);
  } catch (error) {
    logServerError("[POST /api/account/delete]", error);
    return jsonResponse({ ok: false, message: "탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요." }, 500);
  }
}
