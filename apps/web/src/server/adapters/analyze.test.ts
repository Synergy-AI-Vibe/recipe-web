import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeResponseSchema, type StorePrice } from "@recipe-web/api";
import { computeTotals, computeWarnings } from "@/lib/calc";
import { toAnalyzeResponse } from "@/server/adapters/analyze";
import type { PocItem, PocResult } from "@/server/recipe/analyze.js";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ estimateStorePrice: vi.fn(), matchStorePrice: vi.fn() }));

vi.mock("@/server/recipe/price/llm-store-price.js", () => ({ estimateStorePrice: mocks.estimateStorePrice }));
vi.mock("@/server/data/store-price", () => ({ matchStorePrice: mocks.matchStorePrice }));

const STORE: StorePrice = {
  menuName: "김치찌개",
  min: 16000,
  max: 22000,
  avg: 19000,
  deliveryFee: 3000,
  sampleSize: 12,
  surveyedOn: "2026-09-01",
};

const createItem = (overrides: Partial<PocItem> = {}): PocItem => ({
  raw: "돼지고기 200g",
  section: null,
  name: "돼지고기",
  qty: 200,
  unit: "g",
  amount: { value: 200, base: "g", basis: "200g → 무게 단위 직접 사용" },
  amountIssue: null,
  confidence: "high",
  canonical: "돼지고기",
  priceSource: { tier: 1, name: "KAMIS", asOf: "2026-09-01", per: "g", unitPrice: 18.5, live: true },
  cost: 3700,
  packCost: 9250,
  pack: { size: 500, unit: "g", price: 9250, label: "500g" },
  category: "주재료",
  issues: [],
  ...overrides,
});

const createPoc = (fetched: Partial<PocResult["fetched"]> = {}, items: PocItem[] = [createItem()]): PocResult => ({
  servings: { used: 2, source: "detected", detected: null },
  fetched: {
    ok: true,
    source: "youtube",
    title: "돼지고기 김치찌개",
    channel: "자취요리연구소",
    reason: null,
    message: null,
    text: "돼지고기 200g",
    ...fetched,
  },
  pricing: {
    items,
    servings: 2,
    summary: { consumedCost: 0, basketCost: 0, coverage: 0, criticalExcluded: [] },
  },
  priceMeta: { asOf: "2026-08-30" },
});

const YOUTUBE_URL = "https://youtu.be/abcdefghijk";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.estimateStorePrice.mockResolvedValue(STORE);
  mocks.matchStorePrice.mockResolvedValue(null);
});

describe("toAnalyzeResponse: 성공", () => {
  it("유튜브 레시피를 화면 형식으로 바꾼다", async () => {
    const response = await toAnalyzeResponse(createPoc(), { url: YOUTUBE_URL });

    expect(response.status).toBe("success");
    if (response.status !== "success") return;
    expect(response.data.recipe).toEqual({
      title: "돼지고기 김치찌개",
      servings: 2,
      sourceType: "youtube",
      sourceUrl: YOUTUBE_URL,
      thumbnailUrl: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
      channelName: "자취요리연구소",
      steps: [],
      rawText: "돼지고기 200g",
    });
  });

  it("직접 입력 레시피는 주소와 썸네일, 원문을 비운다", async () => {
    const poc = createPoc({ source: "manual", title: "직접 입력", channel: null });

    const response = await toAnalyzeResponse(poc, { text: "돼지고기 200g" });

    expect(response.status).toBe("success");
    if (response.status !== "success") return;
    expect(response.data.recipe).toMatchObject({
      sourceType: "manual",
      sourceUrl: null,
      thumbnailUrl: null,
      channelName: null,
      rawText: null,
    });
  });

  it("재료 한 줄을 화면 형식으로 바꾸고 번호는 1부터 붙인다", async () => {
    const poc = createPoc({}, [createItem(), createItem({ raw: "신김치 300g", name: "신김치", canonical: "김치" })]);

    const response = await toAnalyzeResponse(poc, { url: YOUTUBE_URL });

    if (response.status !== "success") throw new Error("success expected");
    expect(response.data.ingredients[0]).toEqual({
      id: 1,
      rawText: "돼지고기 200g",
      name: "돼지고기",
      role: "main",
      qty: 200,
      unit: "g",
      amount: 200,
      amountUnit: "g",
      conversionNote: "200g → 무게 단위 직접 사용",
      needsConfirm: false,
      unitCost: 3700,
      packCost: 9250,
      packLabel: "500g 9,250원",
      priceTier: 1,
      priceConfidence: "actual",
      hasPrice: true,
      checked: true,
      userPrice: null,
    });
    expect(response.data.ingredients.map((row) => row.id)).toEqual([1, 2]);
  });

  it("합계와 경고는 화면과 같은 계산식으로 구한다", async () => {
    const poc = createPoc({}, [
      createItem(),
      createItem({ raw: "사골육수 1팩", name: "사골육수", canonical: null, cost: null, packCost: null, pack: null, amount: null, priceSource: null }),
    ]);

    const response = await toAnalyzeResponse(poc, { url: YOUTUBE_URL });

    if (response.status !== "success") throw new Error("success expected");
    expect(response.data.totals).toEqual(computeTotals(response.data.ingredients, STORE, 2));
    expect(response.data.warnings).toEqual(computeWarnings(response.data.ingredients));
    expect(response.data.totals.ingredientTotal).toBe(3700);
    expect(response.data.warnings.missingMain).toEqual(["사골육수 1팩"]);
  });

  it("가격이 없는 재료는 금액 없음과 확인 필요로 표시한다", async () => {
    const unpriced = createItem({
      canonical: null,
      cost: null,
      packCost: null,
      pack: null,
      amount: null,
      amountIssue: { reason: "UNKNOWN_UNIT", detail: "단위를 알 수 없어요" },
      priceSource: null,
    });

    const response = await toAnalyzeResponse(createPoc({}, [unpriced]), { url: YOUTUBE_URL });

    if (response.status !== "success") throw new Error("success expected");
    expect(response.data.ingredients[0]).toMatchObject({
      name: null,
      hasPrice: false,
      needsConfirm: true,
      conversionNote: "단위를 알 수 없어요",
      packLabel: null,
      priceTier: null,
      priceConfidence: null,
    });
  });

  it("가격 출처에 따라 실시세·추정·직접 입력으로 구분한다", async () => {
    const source = (tier: 1 | 2 | 3, live: boolean) => ({ tier, name: "출처", asOf: null, per: "g" as const, unitPrice: 1, live });
    const poc = createPoc({}, [
      createItem({ priceSource: source(1, true) }),
      createItem({ priceSource: source(2, false) }),
      createItem({ priceSource: source(3, false) }),
      createItem({ priceSource: null }),
    ]);

    const response = await toAnalyzeResponse(poc, { url: YOUTUBE_URL });

    if (response.status !== "success") throw new Error("success expected");
    expect(response.data.ingredients.map((row) => row.priceConfidence)).toEqual(["actual", "estimate", "user", null]);
  });

  it("가격 기준일은 재료 가격 중 가장 최근 날짜를 쓰고, 없으면 기준 정보의 날짜를 쓴다", async () => {
    const withDates = createPoc({}, [
      createItem({ priceSource: { tier: 1, name: "a", asOf: "2026-09-01", per: "g", unitPrice: 1, live: true } }),
      createItem({ priceSource: { tier: 1, name: "b", asOf: "2026-09-03", per: "g", unitPrice: 1, live: true } }),
      createItem({ priceSource: { tier: 2, name: "c", asOf: null, per: "g", unitPrice: 1, live: false } }),
    ]);
    const withoutDates = createPoc({}, [createItem({ priceSource: null })]);

    const first = await toAnalyzeResponse(withDates, { url: YOUTUBE_URL });
    const second = await toAnalyzeResponse(withoutDates, { url: YOUTUBE_URL });

    if (first.status !== "success" || second.status !== "success") throw new Error("success expected");
    expect(first.data.priceBaseDate).toBe("2026-09-03");
    expect(second.data.priceBaseDate).toBe("2026-08-30");
  });

  it("화면이 검증하는 응답 형식(스키마)과 일치한다", async () => {
    const response = await toAnalyzeResponse(createPoc(), { url: YOUTUBE_URL });

    expect(analyzeResponseSchema.safeParse(JSON.parse(JSON.stringify(response))).success).toBe(true);
  });

  it("직접 입력은 제목이 의미 없으므로 사 먹는 가격을 추정하거나 찾지 않는다", async () => {
    const poc = createPoc({ source: "manual", title: "직접 입력", channel: null });

    const response = await toAnalyzeResponse(poc, { text: "돼지고기 200g" });

    if (response.status !== "success") throw new Error("success expected");
    expect(response.data.store).toBeNull();
    expect(mocks.estimateStorePrice).not.toHaveBeenCalled();
    expect(mocks.matchStorePrice).not.toHaveBeenCalled();
  });

  it("제목이 없으면 이름 없는 레시피로 표시하고 사 먹는 가격은 찾지 않는다", async () => {
    const response = await toAnalyzeResponse(createPoc({ title: null }), { url: YOUTUBE_URL });

    if (response.status !== "success") throw new Error("success expected");
    expect(response.data.recipe.title).toBe("이름 없는 레시피");
    expect(response.data.store).toBeNull();
    expect(mocks.estimateStorePrice).not.toHaveBeenCalled();
    expect(mocks.matchStorePrice).not.toHaveBeenCalled();
  });
});

describe("toAnalyzeResponse: 사 먹는 가격", () => {
  it("추정값이 있으면 그것을 쓰고 DB는 조회하지 않는다", async () => {
    const response = await toAnalyzeResponse(createPoc(), { url: YOUTUBE_URL });

    if (response.status !== "success") throw new Error("success expected");
    expect(response.data.store).toEqual(STORE);
    expect(mocks.estimateStorePrice).toHaveBeenCalledWith("돼지고기 김치찌개");
    expect(mocks.matchStorePrice).not.toHaveBeenCalled();
  });

  it("추정값이 없으면 DB에서 찾은 값을 쓴다", async () => {
    mocks.estimateStorePrice.mockResolvedValue(null);
    mocks.matchStorePrice.mockResolvedValue({ ...STORE, avg: 15000 });

    const response = await toAnalyzeResponse(createPoc(), { url: YOUTUBE_URL });

    if (response.status !== "success") throw new Error("success expected");
    expect(response.data.store?.avg).toBe(15000);
    expect(mocks.matchStorePrice).toHaveBeenCalledWith("돼지고기 김치찌개");
  });

  it("둘 다 없으면 사 먹는 가격 없이 응답하고 절약 계산을 하지 않는다", async () => {
    mocks.estimateStorePrice.mockResolvedValue(null);

    const response = await toAnalyzeResponse(createPoc(), { url: YOUTUBE_URL });

    if (response.status !== "success") throw new Error("success expected");
    expect(response.data.store).toBeNull();
    expect(response.data.totals).toMatchObject({ savings: 0, savingsPercent: 0, barPercent: 0 });
  });
});

describe("toAnalyzeResponse: 재료 구분", () => {
  it("조미료 분류와 조리 단계 문장 조각은 조미료로 내려 경고에서 뺀다", async () => {
    const poc = createPoc({}, [
      createItem({ raw: "고춧가루 2큰술", name: "고춧가루", canonical: "고춧가루", category: "조미료" }),
      createItem({ raw: "야채와 고기 준비하기", name: "야채와 고기 준비하기", canonical: null, qty: null, unit: null, category: "주재료" }),
      createItem({ raw: "준비 (2~3인분)", name: "준비", canonical: null, qty: 2, unit: "인분", category: "주재료" }),
      createItem({ raw: "양파 1개", name: "양파", canonical: "양파", category: "주재료" }),
    ]);

    const response = await toAnalyzeResponse(poc, { url: YOUTUBE_URL });

    if (response.status !== "success") throw new Error("success expected");
    expect(response.data.ingredients.map((row) => row.role)).toEqual(["seasoning", "seasoning", "seasoning", "main"]);
  });

  it("수량이 있거나 표준 재료로 찾은 재료는 문장 조각으로 보지 않는다", async () => {
    const poc = createPoc({}, [
      createItem({ name: "손질하기", canonical: "손질하기", qty: null, unit: null }),
      createItem({ name: "밑간", canonical: null, qty: 1, unit: "큰술" }),
    ]);

    const response = await toAnalyzeResponse(poc, { url: YOUTUBE_URL });

    if (response.status !== "success") throw new Error("success expected");
    expect(response.data.ingredients.map((row) => row.role)).toEqual(["main", "main"]);
  });
});

describe("toAnalyzeResponse: 재료를 찾지 못한 경우", () => {
  it("가져오지 못한 영상은 이유를 알리고 직접 입력을 안내한다", async () => {
    const poc = createPoc({ ok: false, title: null, message: "영상을 찾을 수 없습니다." }, []);

    const response = await toAnalyzeResponse(poc, { url: YOUTUBE_URL });

    expect(response).toEqual({
      status: "no_recipe_found",
      videoTitle: null,
      thumbnailUrl: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg",
      message: "영상을 찾을 수 없습니다.",
    });
  });

  it("재료가 하나도 없으면 영상 제목과 기본 안내를 돌려준다", async () => {
    const response = await toAnalyzeResponse(createPoc({ message: null }, []), { url: YOUTUBE_URL });

    expect(response).toMatchObject({
      status: "no_recipe_found",
      videoTitle: "돼지고기 김치찌개",
      message: "영상에서 재료를 찾지 못했어요. 아래에 직접 적어주시면 바로 계산해 드릴게요.",
    });
  });

  it("사 먹는 가격을 찾지 않는다", async () => {
    await toAnalyzeResponse(createPoc({}, []), { url: YOUTUBE_URL });

    expect(mocks.estimateStorePrice).not.toHaveBeenCalled();
  });

  it("직접 입력은 썸네일이 없다", async () => {
    const response = await toAnalyzeResponse(createPoc({ source: "manual" }, []), { text: "무엇" });

    expect(response).toMatchObject({ status: "no_recipe_found", thumbnailUrl: null });
  });

  it("지원하는 유튜브 주소 형태에서 썸네일 주소를 만든다", async () => {
    const urls = [
      "https://www.youtube.com/watch?v=abcdefghijk",
      "https://www.youtube.com/watch?feature=share&v=abcdefghijk",
      "https://www.youtube.com/shorts/abcdefghijk",
      "https://www.youtube.com/live/abcdefghijk",
      "https://youtu.be/abcdefghijk",
    ];

    for (const url of urls) {
      const response = await toAnalyzeResponse(createPoc({}, []), { url });
      expect(response, url).toMatchObject({ thumbnailUrl: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg" });
    }
  });
});
