import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/bookmarks/route";
import { createFakeSupabase, NO_STORE, TEST_USER } from "@/test/fake-supabase";

vi.mock("server-only", () => ({}));

const state = vi.hoisted(() => ({ fake: undefined as unknown, responseHeaders: {} as Record<string, string> }));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabaseClient: async () => ({ supabase: state.fake, responseHeaders: state.responseHeaders }),
}));

const row = {
  id: 7,
  title: "김치찌개",
  source_type: "youtube",
  source_url: "https://youtu.be/abc",
  servings: 2,
  raw_text: null,
  created_at: "2026-10-02T10:00:00Z",
};

const youtubeBody = { title: "김치찌개", sourceType: "youtube", sourceUrl: "https://youtu.be/abc", servings: 2 };
const manualBody = { title: "볶음밥", sourceType: "manual", sourceUrl: null, servings: 1, rawText: "밥 1공기" };

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/bookmarks", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const use = (options: Parameters<typeof createFakeSupabase>[0] = {}) => {
  const fake = createFakeSupabase(options);
  state.fake = fake.supabase;
  return fake;
};

beforeEach(() => {
  state.responseHeaders = {};
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/bookmarks", () => {
  it("로그인하지 않으면 401이다", async () => {
    use({ user: null });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false, reason: "unauthorized" });
  });

  it("내 북마크 목록과 개수, 한도를 돌려준다", async () => {
    use({ result: { data: [row], error: null } });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, count: 1, limit: 5 });
    expect(body.items[0]).toMatchObject({ id: 7, sourceType: "youtube", rawText: null });
  });

  it("목록에는 금액을 담지 않는다", async () => {
    use({ result: { data: [row], error: null } });

    const body = await (await GET()).json();

    expect(JSON.stringify(body)).not.toMatch(/cost|price|금액/);
  });

  it("조회에 실패하면 500이고 DB 메시지를 숨긴다", async () => {
    use({ result: { data: null, error: { message: "relation public.bookmark does not exist" } } });

    const response = await GET();

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("relation");
  });

  it("세션 갱신으로 받은 캐시 방지 헤더를 응답에 붙인다", async () => {
    use();
    state.responseHeaders = { "Cache-Control": NO_STORE };

    const response = await GET();

    expect(response.headers.get("cache-control")).toBe(NO_STORE);
  });
});

describe("POST /api/bookmarks", () => {
  it("로그인하지 않으면 저장하지 않고 401이다", async () => {
    const { query } = use({ user: null });

    const response = await post(youtubeBody);

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false, reason: "unauthorized" });
    expect(query.insert).not.toHaveBeenCalled();
  });

  it("유튜브 북마크를 세션의 사용자로 저장한다", async () => {
    const { query } = use({ result: { data: row, error: null } });

    const response = await post(youtubeBody);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, bookmark: { id: 7 } });
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: TEST_USER.id, source_type: "youtube" }));
  });

  it("요청에 실린 사용자 ID는 무시하고 세션의 사용자로 저장한다", async () => {
    const { query } = use({ result: { data: row, error: null } });

    await post({ ...youtubeBody, user_id: "other-user", userId: "other-user" });

    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: TEST_USER.id }));
  });

  it("직접 입력 북마크는 원문과 함께 저장한다", async () => {
    const saved = { ...row, source_type: "manual", source_url: null, raw_text: "밥 1공기" };
    const { query } = use({ result: { data: saved, error: null } });

    const response = await post(manualBody);

    expect(response.status).toBe(200);
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ raw_text: "밥 1공기", source_url: null }));
  });

  it("5개를 넘으면 409(limit)이다", async () => {
    use({ result: { data: null, error: { code: "P0001", message: "북마크는 최대 5개까지 저장할 수 있어요." } } });

    const response = await post(youtubeBody);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ ok: false, reason: "limit" });
  });

  it("같은 영상은 409(duplicate)이다", async () => {
    use({ result: { data: null, error: { code: "23505", message: "duplicate key" } } });

    const response = await post(youtubeBody);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ ok: false, reason: "duplicate" });
  });

  it("그 밖의 저장 오류는 500(error)이다", async () => {
    use({ result: { data: null, error: { code: "XX000", message: "boom" } } });

    const response = await post(youtubeBody);

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ ok: false, reason: "error" });
  });

  it.each([
    ["JSON이 아닌 본문", "not json"],
    ["본문 없음", "null"],
    ["제목 없음", { ...youtubeBody, title: "  " }],
    ["유튜브인데 주소 없음", { ...youtubeBody, sourceUrl: "" }],
    ["유튜브 주소가 아님", { ...youtubeBody, sourceUrl: "https://example.com/watch?v=1" }],
    ["직접 입력인데 원문 없음", { ...manualBody, rawText: "" }],
    ["인분 수가 0", { ...youtubeBody, servings: 0 }],
    ["알 수 없는 출처", { ...youtubeBody, sourceType: "blog" }],
  ])("잘못된 요청(%s)은 저장하지 않고 400이다", async (_name, body) => {
    const { query } = use();

    const response = await post(body);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, reason: "invalid_input" });
    expect(query.insert).not.toHaveBeenCalled();
  });

  it("제목 앞뒤 공백은 지우고 저장한다", async () => {
    const { query } = use({ result: { data: row, error: null } });

    await post({ ...youtubeBody, title: "  김치찌개  " });

    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ title: "김치찌개" }));
  });
});
