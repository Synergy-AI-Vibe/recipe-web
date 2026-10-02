import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createApiClient } from "./create-api-client";
import { PANTRY_REQUEST_TIMEOUT_MS, searchPantry } from "./pantry";

const server = setupServer();
const client = createApiClient({ baseURL: "https://api.example.test/api" });
const URL = "https://api.example.test/api/pantry";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

const menu = {
  name: "김치찌개",
  description: "신김치와 돼지고기로 끓입니다",
  usedIngredients: ["돼지고기", "신김치"],
  extraIngredients: [
    {
      name: "두부",
      canonical: "두부",
      packCost: 2000,
      packLabel: "1모 2,000원",
      priceConfidence: "actual",
      hasPrice: true,
    },
    {
      name: "사골육수",
      canonical: null,
      packCost: null,
      packLabel: null,
      priceConfidence: null,
      hasPrice: false,
    },
  ],
  extraCost: 2000,
  unpricedCount: 1,
};

describe("searchPantry", () => {
  it("재료 목록을 보내고 추천 메뉴를 읽는다", async () => {
    server.use(
      http.post(URL, async ({ request }) => {
        expect(await request.json()).toEqual({ ingredients: ["돼지고기", "신김치"] });
        return HttpResponse.json({ status: "success", menus: [menu] });
      }),
    );

    await expect(searchPantry(client, ["돼지고기", "신김치"])).resolves.toEqual({
      status: "success",
      menus: [menu],
    });
  });

  it("추천 없음은 오류가 아니라 응답으로 돌려준다", async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json({ status: "error", reason: "no_menu", message: "추천을 만들지 못했어요" }),
      ),
    );

    await expect(searchPantry(client, ["돼지고기"])).resolves.toEqual({
      status: "error",
      reason: "no_menu",
      message: "추천을 만들지 못했어요",
    });
  });

  it("서버 실패(502)는 오류로 던진다", async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json({ status: "error", reason: "failed", message: "추천을 불러오지 못했어요" }, { status: 502 }),
      ),
    );

    await expect(searchPantry(client, ["돼지고기"])).rejects.toMatchObject({ kind: "http", status: 502 });
  });

  it("응답 형식이 다르면 검증 오류로 처리한다", async () => {
    server.use(http.post(URL, () => HttpResponse.json({ status: "success", menus: [{ name: "형식 오류" }] })));

    await expect(searchPantry(client, ["돼지고기"])).rejects.toMatchObject({ kind: "validation" });
  });

  it("추천에 시간이 걸리므로 요청별 대기 시간을 60초로 보낸다", async () => {
    server.use(http.post(URL, () => HttpResponse.json({ status: "success", menus: [] })));
    const post = vi.spyOn(client, "post");

    await searchPantry(client, ["돼지고기"]);

    expect(PANTRY_REQUEST_TIMEOUT_MS).toBe(60_000);
    expect(post).toHaveBeenCalledWith("/pantry", { ingredients: ["돼지고기"] }, { timeout: 60_000 });
  });
});
