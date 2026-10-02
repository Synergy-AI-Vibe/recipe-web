import { afterEach, describe, expect, it, vi } from "vitest";
import type { CreateBookmarkRequest } from "@recipe-web/api";
import { createBookmark, deleteBookmark, listBookmarks } from "@/server/data/bookmark";
import { createFakeSupabase } from "@/test/fake-supabase";

vi.mock("server-only", () => ({}));

const row = {
  id: 7,
  title: "김치찌개",
  source_type: "youtube",
  source_url: "https://youtu.be/abc",
  servings: 2,
  raw_text: null,
  created_at: "2026-10-02T10:00:00Z",
};

const youtube: CreateBookmarkRequest = {
  title: "김치찌개",
  sourceType: "youtube",
  sourceUrl: "https://youtu.be/abc",
  servings: 2,
};

const manual: CreateBookmarkRequest = {
  title: "볶음밥",
  sourceType: "manual",
  sourceUrl: null,
  servings: 1,
  rawText: "밥 1공기",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listBookmarks", () => {
  it("최신 저장 순서로 읽고 화면 형식(camelCase)으로 바꾼다", async () => {
    const { supabase, query, from } = createFakeSupabase({ result: { data: [row], error: null } });

    const items = await listBookmarks(supabase);

    expect(from).toHaveBeenCalledWith("bookmark");
    expect(query.select).toHaveBeenCalledWith("id, title, source_type, source_url, servings, raw_text, created_at");
    expect(query.order).toHaveBeenNthCalledWith(1, "created_at", { ascending: false });
    expect(query.order).toHaveBeenNthCalledWith(2, "id", { ascending: false });
    expect(items).toEqual([
      {
        id: 7,
        title: "김치찌개",
        sourceType: "youtube",
        sourceUrl: "https://youtu.be/abc",
        servings: 2,
        rawText: null,
        createdAt: "2026-10-02T10:00:00Z",
      },
    ]);
  });

  it("직접 입력 북마크의 원문을 함께 읽는다", async () => {
    const manualRow = { ...row, source_type: "manual", source_url: null, raw_text: "밥 1공기" };
    const { supabase } = createFakeSupabase({ result: { data: [manualRow], error: null } });

    const [item] = await listBookmarks(supabase);

    expect(item).toMatchObject({ sourceType: "manual", sourceUrl: null, rawText: "밥 1공기" });
  });

  it("결과가 없으면 빈 목록이다", async () => {
    const { supabase } = createFakeSupabase({ result: { data: null, error: null } });

    await expect(listBookmarks(supabase)).resolves.toEqual([]);
  });

  it("조회 오류는 던진다", async () => {
    const { supabase } = createFakeSupabase({ result: { data: null, error: { message: "db down" } } });

    await expect(listBookmarks(supabase)).rejects.toThrow("db down");
  });
});

describe("createBookmark", () => {
  it("유튜브 북마크는 주소를 저장하고 원문은 비운다", async () => {
    const { supabase, query } = createFakeSupabase({ result: { data: row, error: null } });

    const result = await createBookmark(supabase, "user-1", youtube);

    expect(query.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      title: "김치찌개",
      source_type: "youtube",
      source_url: "https://youtu.be/abc",
      servings: 2,
      raw_text: null,
    });
    expect(result).toMatchObject({ ok: true, bookmark: { id: 7, sourceType: "youtube" } });
  });

  it("직접 입력 북마크는 원문을 저장하고 주소는 비운다", async () => {
    const saved = { ...row, source_type: "manual", source_url: null, raw_text: "밥 1공기" };
    const { supabase, query } = createFakeSupabase({ result: { data: saved, error: null } });

    const result = await createBookmark(supabase, "user-1", manual);

    expect(query.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      title: "볶음밥",
      source_type: "manual",
      source_url: null,
      servings: 1,
      raw_text: "밥 1공기",
    });
    expect(result).toMatchObject({ ok: true, bookmark: { rawText: "밥 1공기" } });
  });

  it("5개를 넘으면 DB 안내 문구 대신 고정 문구로 한도 초과를 알린다", async () => {
    const error = { code: "P0001", message: "북마크는 최대 5개까지 저장할 수 있어요. 기존 북마크를 삭제한 뒤 다시 시도해 주세요." };
    const { supabase } = createFakeSupabase({ result: { data: null, error } });

    await expect(createBookmark(supabase, "user-1", youtube)).resolves.toEqual({
      ok: false,
      reason: "limit",
      message: "북마크는 최대 5개까지 저장할 수 있어요.",
    });
  });

  it("같은 영상을 다시 저장하면 이미 저장됨으로 알린다", async () => {
    const error = { code: "23505", message: "duplicate key value violates unique constraint" };
    const { supabase } = createFakeSupabase({ result: { data: null, error } });

    await expect(createBookmark(supabase, "user-1", youtube)).resolves.toEqual({
      ok: false,
      reason: "duplicate",
      message: "이미 저장한 레시피예요.",
    });
  });

  it("그 밖의 오류는 DB 메시지를 숨기고 서버 로그에만 남긴다", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = { code: "XX000", message: "relation public.bookmark does not exist" };
    const { supabase } = createFakeSupabase({ result: { data: null, error } });

    const result = await createBookmark(supabase, "user-1", youtube);

    expect(result).toEqual({ ok: false, reason: "error", message: "북마크를 저장하지 못했어요." });
    expect(JSON.stringify(result)).not.toContain("relation");
    expect(logged).toHaveBeenCalled();
  });
});

describe("deleteBookmark", () => {
  it("ID로 지운다", async () => {
    const { supabase, query } = createFakeSupabase({ result: { error: null } });

    await deleteBookmark(supabase, 7);

    expect(query.delete).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith("id", 7);
  });

  it("삭제 오류는 던진다", async () => {
    const { supabase } = createFakeSupabase({ result: { error: { message: "denied" } } });

    await expect(deleteBookmark(supabase, 7)).rejects.toThrow("denied");
  });
});
