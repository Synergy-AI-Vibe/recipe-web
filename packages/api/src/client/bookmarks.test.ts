import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApiClient } from "./create-api-client";
import { createBookmark, deleteBookmark, getBookmarks } from "./bookmarks";
import { createBookmarkRequestSchema } from "../schemas/bookmarks";

const baseURL = "https://api.example.test/api";
const server = setupServer();
const client = createApiClient({ baseURL });

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("bookmarks API", () => {
  it("서버 목록의 순서와 개수·한도를 그대로 읽는다", async () => {
    server.use(http.get(`${baseURL}/bookmarks`, () => HttpResponse.json({
      ok: true,
      items: [
        { id: 2, title: "김치찌개", sourceType: "youtube", sourceUrl: "https://youtu.be/abc", servings: 2, createdAt: "2026-10-01T10:00:00Z" },
        { id: 1, title: "볶음밥", sourceType: "manual", sourceUrl: null, servings: 1, createdAt: "2026-09-30T10:00:00Z" },
      ],
      count: 2,
      limit: 5,
    })));

    const list = await getBookmarks(client);
    expect(list.items.map((item) => item.id)).toEqual([2, 1]);
    expect(list.count).toBe(2);
    expect(list.limit).toBe(5);
  });

  it("원문 항목이 없는 예전 응답도 읽고 원문은 null로 둔다", async () => {
    server.use(http.get(`${baseURL}/bookmarks`, () => HttpResponse.json({
      ok: true,
      items: [{ id: 1, title: "볶음밥", sourceType: "manual", sourceUrl: null, servings: 1, createdAt: "2026-09-30T10:00:00Z" }],
      count: 1,
      limit: 5,
    })));

    const list = await getBookmarks(client);
    expect(list.items[0].rawText).toBeNull();
  });

  it("원문이 있는 직접 입력 북마크를 읽는다", async () => {
    server.use(http.get(`${baseURL}/bookmarks`, () => HttpResponse.json({
      ok: true,
      items: [{ id: 1, title: "볶음밥", sourceType: "manual", sourceUrl: null, servings: 1, rawText: "밥 1공기", createdAt: "2026-09-30T10:00:00Z" }],
      count: 1,
      limit: 5,
    })));

    const list = await getBookmarks(client);
    expect(list.items[0].rawText).toBe("밥 1공기");
  });

  it("삭제는 ID 경로로 보내고 서버 성공 여부를 검증한다", async () => {
    server.use(http.delete(`${baseURL}/bookmarks/7`, () => HttpResponse.json({ ok: true })));
    await expect(deleteBookmark(client, 7)).resolves.toBeUndefined();
    server.use(http.delete(`${baseURL}/bookmarks/7`, () => HttpResponse.json({ ok: false })));
    await expect(deleteBookmark(client, 7)).rejects.toMatchObject({ kind: "validation" });
  });
});

const savedBookmark = {
  id: 3,
  title: "김치찌개",
  sourceType: "youtube",
  sourceUrl: "https://youtu.be/abc",
  servings: 2,
  rawText: null,
  createdAt: "2026-10-02T10:00:00Z",
};

const youtubeInput = {
  title: "김치찌개",
  sourceType: "youtube" as const,
  sourceUrl: "https://youtu.be/abc",
  servings: 2,
  rawText: null,
};

describe("createBookmark", () => {
  it("저장 요청을 보내고 저장된 북마크를 읽는다", async () => {
    server.use(
      http.post(`${baseURL}/bookmarks`, async ({ request }) => {
        expect(await request.json()).toEqual(youtubeInput);
        return HttpResponse.json({ ok: true, bookmark: savedBookmark });
      }),
    );

    await expect(createBookmark(client, youtubeInput)).resolves.toEqual({ ok: true, bookmark: savedBookmark });
  });

  it("직접 입력 북마크는 원문을 함께 보낸다", async () => {
    server.use(
      http.post(`${baseURL}/bookmarks`, async ({ request }) => {
        expect(await request.json()).toEqual({ title: "볶음밥", sourceType: "manual", sourceUrl: null, servings: 1, rawText: "밥 1공기" });
        return HttpResponse.json({ ok: true, bookmark: { ...savedBookmark, sourceType: "manual", sourceUrl: null, rawText: "밥 1공기" } });
      }),
    );

    const result = await createBookmark(client, {
      title: "볶음밥",
      sourceType: "manual",
      sourceUrl: null,
      servings: 1,
      rawText: "밥 1공기",
    });

    expect(result).toMatchObject({ ok: true, bookmark: { rawText: "밥 1공기" } });
  });

  it.each([
    [401, "unauthorized"],
    [409, "limit"],
    [409, "duplicate"],
  ] as const)("%i 응답(%s)은 오류로 던지지 않고 결과 값으로 돌려준다", async (status, reason) => {
    server.use(
      http.post(`${baseURL}/bookmarks`, () => HttpResponse.json({ ok: false, reason, message: "안내" }, { status })),
    );

    await expect(createBookmark(client, youtubeInput)).resolves.toEqual({ ok: false, reason, message: "안내" });
  });

  it("서버 오류(500)와 잘못된 요청(400)은 오류로 던진다", async () => {
    server.use(http.post(`${baseURL}/bookmarks`, () => HttpResponse.json({ ok: false }, { status: 500 })));
    await expect(createBookmark(client, youtubeInput)).rejects.toMatchObject({ kind: "http", status: 500 });

    server.use(http.post(`${baseURL}/bookmarks`, () => HttpResponse.json({ ok: false }, { status: 400 })));
    await expect(createBookmark(client, youtubeInput)).rejects.toMatchObject({ kind: "http", status: 400 });
  });

  it("응답 형식이 다르면 검증 오류로 처리한다", async () => {
    server.use(http.post(`${baseURL}/bookmarks`, () => HttpResponse.json({ ok: true })));

    await expect(createBookmark(client, youtubeInput)).rejects.toMatchObject({ kind: "validation" });
  });
});

describe("createBookmarkRequestSchema", () => {
  it("유튜브는 주소가 필요하고 원문은 없어야 한다", () => {
    expect(createBookmarkRequestSchema.safeParse(youtubeInput).success).toBe(true);
    expect(createBookmarkRequestSchema.safeParse({ ...youtubeInput, sourceUrl: "" }).success).toBe(false);
    expect(createBookmarkRequestSchema.safeParse({ ...youtubeInput, rawText: "원문" }).success).toBe(false);
  });

  it("직접 입력은 원문이 필요하고 주소는 없어야 한다", () => {
    const manual = { title: "볶음밥", sourceType: "manual" as const, sourceUrl: null, servings: 1, rawText: "밥 1공기" };

    expect(createBookmarkRequestSchema.safeParse(manual).success).toBe(true);
    expect(createBookmarkRequestSchema.safeParse({ ...manual, rawText: "   " }).success).toBe(false);
    expect(createBookmarkRequestSchema.safeParse({ ...manual, rawText: null }).success).toBe(false);
    expect(createBookmarkRequestSchema.safeParse({ ...manual, sourceUrl: "https://youtu.be/abc" }).success).toBe(false);
  });

  it("제목·인분 수·원문 길이를 제한한다", () => {
    const base = { title: "김치찌개", sourceType: "youtube" as const, sourceUrl: "https://youtu.be/abc", servings: 2 };

    expect(createBookmarkRequestSchema.safeParse({ ...base, title: "가".repeat(201) }).success).toBe(false);
    expect(createBookmarkRequestSchema.safeParse({ ...base, title: "   " }).success).toBe(false);
    expect(createBookmarkRequestSchema.safeParse({ ...base, servings: 0 }).success).toBe(false);
    expect(createBookmarkRequestSchema.safeParse({ ...base, servings: 1.5 }).success).toBe(false);
    expect(createBookmarkRequestSchema.safeParse({ ...base, servings: 101 }).success).toBe(false);
    expect(
      createBookmarkRequestSchema.safeParse({ title: "x", sourceType: "manual", servings: 1, rawText: "가".repeat(20001) }).success,
    ).toBe(false);
  });

  it("알 수 없는 출처 종류는 받지 않는다", () => {
    expect(createBookmarkRequestSchema.safeParse({ ...youtubeInput, sourceType: "blog" }).success).toBe(false);
  });
});
