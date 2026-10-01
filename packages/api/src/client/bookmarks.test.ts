import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApiClient } from "./create-api-client";
import { deleteBookmark, getBookmarks } from "./bookmarks";

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

  it("삭제는 ID 경로로 보내고 서버 성공 여부를 검증한다", async () => {
    server.use(http.delete(`${baseURL}/bookmarks/7`, () => HttpResponse.json({ ok: true })));
    await expect(deleteBookmark(client, 7)).resolves.toBeUndefined();
    server.use(http.delete(`${baseURL}/bookmarks/7`, () => HttpResponse.json({ ok: false })));
    await expect(deleteBookmark(client, 7)).rejects.toMatchObject({ kind: "validation" });
  });
});
