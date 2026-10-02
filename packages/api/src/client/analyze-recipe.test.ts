import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createApiClient } from "./create-api-client";
import { ANALYZE_REQUEST_TIMEOUT_MS, analyzeRecipe } from "./analyze-recipe";

const server = setupServer();
const client = createApiClient({ baseURL: "https://api.example.test/api" });

const successData = {
  recipe: {
    title: "김치찌개",
    servings: 2,
    sourceType: "youtube",
    sourceUrl: "https://youtu.be/abc",
    thumbnailUrl: null,
    channelName: "자취요리연구소",
    steps: [],
    rawText: "돼지고기 200g",
  },
  ingredients: [
    {
      id: 1,
      rawText: "돼지고기 200g",
      name: "돼지고기",
      role: "main",
      qty: 200,
      unit: "g",
      amount: 200,
      amountUnit: "g",
      conversionNote: null,
      needsConfirm: false,
      unitCost: 4000,
      packCost: 9000,
      packLabel: "500g 9,000원",
      priceTier: 1,
      priceConfidence: "actual",
      hasPrice: true,
      checked: true,
      userPrice: null,
    },
  ],
  store: {
    menuName: "김치찌개",
    min: 16000,
    max: 22000,
    avg: 19000,
    deliveryFee: 3000,
    sampleSize: 12,
    surveyedOn: "2026-09-01",
  },
  totals: {
    ingredientTotal: 4000,
    basketTotal: 9000,
    perServing: 2000,
    savings: 15000,
    savingsPercent: 78.9,
    barPercent: 21.1,
  },
  warnings: { missingMain: [], missingSeasoning: [], estimatedCount: 0, pricedCount: 1 },
  priceBaseDate: "2026-09-01",
  normalize: null,
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe("analyzeRecipe", () => {
  it("유튜브 요청을 실제 서버 형식으로 보내고 성공 응답을 읽는다", async () => {
    server.use(
      http.post("https://api.example.test/api/analyze", async ({ request }) => {
        expect(await request.json()).toEqual({ url: "https://youtu.be/abc" });
        return HttpResponse.json({ status: "success", data: successData });
      }),
    );

    await expect(analyzeRecipe(client, { type: "youtube", url: "https://youtu.be/abc" }))
      .resolves.toMatchObject({
        status: "success",
        data: { recipe: { title: "김치찌개" }, store: { avg: 19000 }, totals: { savings: 15000 } },
      });
  });

  it("직접 입력 요청을 보내고 추출 실패 응답을 구분한다", async () => {
    server.use(
      http.post("https://api.example.test/api/analyze", async ({ request }) => {
        expect(await request.json()).toEqual({ text: "두부 1모" });
        return HttpResponse.json({
          status: "no_recipe_found",
          videoTitle: null,
          thumbnailUrl: null,
          message: "재료를 찾지 못했습니다",
        });
      }),
    );

    await expect(analyzeRecipe(client, { type: "text", text: "두부 1모" })).resolves.toMatchObject({
      status: "no_recipe_found",
    });
  });

  it("응답 형식이 다르면 검증 오류로 처리한다", async () => {
    server.use(
      http.post("https://api.example.test/api/analyze", () =>
        HttpResponse.json({ status: "success", data: { recipe: { title: "누락된 응답" } } }),
      ),
    );

    await expect(
      analyzeRecipe(client, { type: "youtube", url: "youtu.be/abc" }),
    ).rejects.toMatchObject({ kind: "validation" });
  });

  it("분석에 시간이 걸리므로 요청별 대기 시간을 60초로 보낸다", async () => {
    server.use(
      http.post("https://api.example.test/api/analyze", () =>
        HttpResponse.json({ status: "no_recipe_found", videoTitle: null, thumbnailUrl: null, message: "없음" }),
      ),
    );
    const post = vi.spyOn(client, "post");

    await analyzeRecipe(client, { type: "text", text: "두부 1모" });

    expect(ANALYZE_REQUEST_TIMEOUT_MS).toBe(60_000);
    expect(post).toHaveBeenCalledWith(
      "/analyze",
      { text: "두부 1모" },
      expect.objectContaining({ timeout: 60_000 }),
    );
  });

  it("서버가 보낸 입력 오류(400) 안내 문구를 오류로 던지지 않고 결과 값으로 돌려준다", async () => {
    server.use(
      http.post(
        "https://api.example.test/api/analyze",
        () => HttpResponse.json({ status: "error", code: "INVALID_URL", message: "유튜브 주소 형식이 아니에요." }, { status: 400 }),
      ),
    );

    await expect(analyzeRecipe(client, { type: "youtube", url: "https://example.com" })).resolves.toEqual({
      status: "error",
      code: "INVALID_URL",
      message: "유튜브 주소 형식이 아니에요.",
    });
  });

  it("서버가 보낸 내부 오류(500) 안내 문구도 결과 값으로 돌려준다", async () => {
    server.use(
      http.post(
        "https://api.example.test/api/analyze",
        () => HttpResponse.json({ status: "error", code: "INTERNAL", message: "계산에 실패했어요. 잠시 후 다시 시도해 주세요." }, { status: 500 }),
      ),
    );

    await expect(analyzeRecipe(client, { type: "text", text: "두부 1모" })).resolves.toMatchObject({
      status: "error",
      code: "INTERNAL",
    });
  });

  it("안내 문구가 없는 서버 오류(500)는 검증 오류로 처리한다", async () => {
    server.use(http.post("https://api.example.test/api/analyze", () => new HttpResponse("Internal Server Error", { status: 500 })));

    await expect(analyzeRecipe(client, { type: "text", text: "두부 1모" })).rejects.toMatchObject({ kind: "validation" });
  });

  it("그 밖의 HTTP 오류(503)는 오류로 던진다", async () => {
    server.use(http.post("https://api.example.test/api/analyze", () => new HttpResponse(null, { status: 503 })));

    await expect(analyzeRecipe(client, { type: "text", text: "두부 1모" })).rejects.toMatchObject({ kind: "http", status: 503 });
  });
});
