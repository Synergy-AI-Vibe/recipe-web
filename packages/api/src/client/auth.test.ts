import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApiClient } from "./create-api-client";
import { deleteAccount, getBookmarkCount } from "./auth";

const baseURL = "https://api.example.test/api";
const server = setupServer();
const client = createApiClient({ baseURL });

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("account API", () => {
  it("탈퇴 전 북마크 목록의 실제 개수를 센다", async () => {
    server.use(http.get(`${baseURL}/bookmarks`, () =>
      HttpResponse.json({ ok: true, items: [{ id: "a" }, { id: "b" }] }),
    ));
    await expect(getBookmarkCount(client)).resolves.toBe(2);
  });

  it("목록 형식이 다르면 0개로 간주하지 않는다", async () => {
    server.use(http.get(`${baseURL}/bookmarks`, () => HttpResponse.json({ count: 2 })));
    await expect(getBookmarkCount(client)).rejects.toMatchObject({ kind: "validation" });
  });

  it("실제 서버의 탈퇴 경로로 POST 요청을 보낸다", async () => {
    let deletionCalled = false;
    server.use(
      http.post(`${baseURL}/account/delete`, () => {
        deletionCalled = true;
        return HttpResponse.json({ ok: true });
      }),
    );
    await deleteAccount(client);
    expect(deletionCalled).toBe(true);
  });
});
