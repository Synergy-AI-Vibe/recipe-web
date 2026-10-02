import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bookmark, CreateBookmarkFailureReason, CreateBookmarkRequest } from "@recipe-web/api";
import { logServerError } from "@/server/api-response";

const COLUMNS = "id, title, source_type, source_url, servings, raw_text, created_at";
const UNIQUE_VIOLATION_CODE = "23505";
const LIMIT_MESSAGE_KEYWORD = "최대 5개";

type BookmarkRow = {
  id: number;
  title: string;
  source_type: "youtube" | "manual";
  source_url: string | null;
  servings: number;
  raw_text: string | null;
  created_at: string;
};

type DbError = { code?: string; message: string };

export type CreateBookmarkResult =
  | { ok: true; bookmark: Bookmark }
  | { ok: false; reason: Exclude<CreateBookmarkFailureReason, "unauthorized">; message: string };

const toBookmark = (row: BookmarkRow): Bookmark => ({
  id: row.id,
  title: row.title,
  sourceType: row.source_type,
  sourceUrl: row.source_url,
  servings: row.servings,
  rawText: row.raw_text,
  createdAt: row.created_at,
});

const toFailure = (error: DbError): CreateBookmarkResult & { ok: false } => {
  if (error.message.includes(LIMIT_MESSAGE_KEYWORD)) {
    return { ok: false, reason: "limit", message: "북마크는 최대 5개까지 저장할 수 있어요." };
  }
  if (error.code === UNIQUE_VIOLATION_CODE) {
    return { ok: false, reason: "duplicate", message: "이미 저장한 레시피예요." };
  }
  logServerError("[bookmark] 저장 실패", error.message);
  return { ok: false, reason: "error", message: "북마크를 저장하지 못했어요." };
};

export const listBookmarks = async (supabase: SupabaseClient): Promise<Bookmark[]> => {
  const { data, error } = await supabase
    .from("bookmark")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as BookmarkRow[]).map(toBookmark);
};

export const createBookmark = async (
  supabase: SupabaseClient,
  userId: string,
  input: CreateBookmarkRequest,
): Promise<CreateBookmarkResult> => {
  const { data, error } = await supabase
    .from("bookmark")
    .insert({
      user_id: userId,
      title: input.title,
      source_type: input.sourceType,
      source_url: input.sourceType === "youtube" ? input.sourceUrl : null,
      servings: input.servings,
      raw_text: input.sourceType === "manual" ? input.rawText : null,
    })
    .select(COLUMNS)
    .single();
  if (error) return toFailure(error);
  return { ok: true, bookmark: toBookmark(data as BookmarkRow) };
};

export const deleteBookmark = async (supabase: SupabaseClient, id: number): Promise<void> => {
  const { error } = await supabase.from("bookmark").delete().eq("id", id);
  if (error) throw new Error(error.message);
};
