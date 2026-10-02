import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  generateJsonWithRetry: vi.fn(),
  pickModels: vi.fn(),
  canonicalize: vi.fn(),
  priceItem: vi.fn(),
}));

vi.mock("@/server/recipe/llm/gemini.js", () => ({
  generateJsonWithRetry: mocks.generateJsonWithRetry,
  pickModels: mocks.pickModels,
}));
vi.mock("@/server/recipe/price/index.js", () => ({
  canonicalize: mocks.canonicalize,
  priceItem: mocks.priceItem,
}));

type Draft = { name?: string; description?: string; uses?: string[]; extras?: string[] };

const llm = (menus: Draft[]) => ({ data: { menus }, model: "m", usage: { input: 1, output: 1, total: 2 } });

const loadRecommend = async () => {
  vi.resetModules();
  return import("@/server/pantry/recommend");
};

const setPrices = (prices: Record<string, { price: number; live?: boolean } | null>) => {
  mocks.canonicalize.mockImplementation((name: string) => (name in prices ? name : null));
  mocks.priceItem.mockImplementation(async ({ name }: { name: string }) => {
    const entry = prices[name];
    if (!entry) return { pack: null, priceSource: null };
    return {
      pack: { price: entry.price, label: `${name}팩` },
      priceSource: { live: entry.live ?? false },
    };
  });
};

beforeEach(() => {
  mocks.pickModels.mockResolvedValue(["gemini-flash", "gemini-flash-lite"]);
  mocks.generateJsonWithRetry.mockResolvedValue(llm([]));
  setPrices({});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("recommendMenus: AI 요청", () => {
  it("가볍고 빠른 모델을 우선 고르고 한 번만 고른다", async () => {
    const { recommendMenus } = await loadRecommend();
    mocks.generateJsonWithRetry.mockResolvedValue(llm([{ name: "김치찌개", uses: [], extras: [] }]));

    await recommendMenus(["돼지고기"]);
    await recommendMenus(["두부"]);

    expect(mocks.generateJsonWithRetry.mock.calls[0][0].model).toBe("gemini-flash-lite");
    expect(mocks.generateJsonWithRetry.mock.calls[1][0].model).toBe("gemini-flash-lite");
    expect(mocks.pickModels).toHaveBeenCalledTimes(1);
  });

  it("가벼운 모델이 없으면 첫 번째 모델을 쓴다", async () => {
    const { recommendMenus } = await loadRecommend();
    mocks.pickModels.mockResolvedValue(["gemini-pro", "gemini-flash"]);
    mocks.generateJsonWithRetry.mockResolvedValue(llm([{ name: "김치찌개", uses: [], extras: [] }]));

    await recommendMenus(["돼지고기"]);

    expect(mocks.generateJsonWithRetry.mock.calls[0][0].model).toBe("gemini-pro");
  });

  it("보유 재료를 번호 목록으로 보내고 공백·중복·빈 이름은 제거한다", async () => {
    const { recommendMenus } = await loadRecommend();

    await recommendMenus([" 돼지고기 ", "신김치", "돼지고기", "  "]);

    const request = mocks.generateJsonWithRetry.mock.calls[0][0];
    expect(request.user).toBe("## 보유 재료\n1. 돼지고기\n2. 신김치");
  });

  it("금액은 AI가 정하지 못하도록 요청 형식에 가격 항목이 없고, 대기 시간 60초와 재시도 2회를 쓴다", async () => {
    const { recommendMenus } = await loadRecommend();

    await recommendMenus(["돼지고기"]);

    const [request, retry] = mocks.generateJsonWithRetry.mock.calls[0];
    expect(JSON.stringify(request.schema)).not.toMatch(/price|cost|금액|가격/i);
    expect(request.timeout).toBe(60_000);
    expect(retry).toEqual({ attempts: 2 });
    expect(request.system).toContain("메뉴는 4개");
    expect(request.system).toContain("uses 에는");
  });
});

describe("recommendMenus: AI 응답 정리", () => {
  it("입력에 없는 재료를 쓰는 재료로 끼워 넣으면 걸러낸다", async () => {
    const { recommendMenus } = await loadRecommend();
    mocks.generateJsonWithRetry.mockResolvedValue(
      llm([{ name: "찌개", uses: ["돼지고기", "두부", " 신김치 "], extras: [] }]),
    );

    const [menu] = await recommendMenus(["돼지고기", "신김치"]);

    expect(menu.usedIngredients).toEqual(["돼지고기", "신김치"]);
  });

  it("이름이 없는 메뉴는 버리고 이름·설명 앞뒤 공백을 지운다", async () => {
    const { recommendMenus } = await loadRecommend();
    mocks.generateJsonWithRetry.mockResolvedValue(
      llm([{ name: "  ", uses: [] }, { name: " 찌개 ", description: " 설명 ", uses: [], extras: [] }, {}]),
    );

    const menus = await recommendMenus(["돼지고기"]);

    expect(menus).toHaveLength(1);
    expect(menus[0]).toMatchObject({ name: "찌개", description: "설명" });
  });

  it("추가 재료는 중복과 빈 이름을 지우고 메뉴당 8개까지만 받는다", async () => {
    const { recommendMenus } = await loadRecommend();
    const extras = ["a", "b", "a", " ", "c", "d", "e", "f", "g", "h", "i", "j"];
    mocks.generateJsonWithRetry.mockResolvedValue(llm([{ name: "찌개", uses: [], extras }]));

    const [menu] = await recommendMenus(["돼지고기"]);

    expect(menu.extraIngredients.map((extra) => extra.name)).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
  });

  it("메뉴가 하나도 없으면 빈 목록이다", async () => {
    const { recommendMenus } = await loadRecommend();

    await expect(recommendMenus(["돼지고기"])).resolves.toEqual([]);
  });

  it("응답에 메뉴 항목이 아예 없어도 빈 목록이다", async () => {
    const { recommendMenus } = await loadRecommend();
    mocks.generateJsonWithRetry.mockResolvedValue({ data: {}, model: "m", usage: { input: 0, output: 0, total: 0 } });

    await expect(recommendMenus(["돼지고기"])).resolves.toEqual([]);
  });
});

describe("recommendMenus: 추가 재료 금액", () => {
  it("추가 재료는 구매 단위 가격으로 매기고 합계를 낸다", async () => {
    const { recommendMenus } = await loadRecommend();
    setPrices({ 두부: { price: 1800, live: true }, 대파: { price: 2250 } });
    mocks.generateJsonWithRetry.mockResolvedValue(llm([{ name: "찌개", uses: [], extras: ["두부", "대파"] }]));

    const [menu] = await recommendMenus(["돼지고기"]);

    expect(menu.extraCost).toBe(4050);
    expect(menu.unpricedCount).toBe(0);
    expect(menu.extraIngredients).toEqual([
      { name: "두부", canonical: "두부", packCost: 1800, packLabel: "두부팩 1,800원", priceConfidence: "actual", hasPrice: true },
      { name: "대파", canonical: "대파", packCost: 2250, packLabel: "대파팩 2,250원", priceConfidence: "estimate", hasPrice: true },
    ]);
  });

  it("표준 재료로 찾지 못한 재료는 가격을 부르지 않고 가격 미확인으로 센다", async () => {
    const { recommendMenus } = await loadRecommend();
    setPrices({ 두부: { price: 1800 } });
    mocks.generateJsonWithRetry.mockResolvedValue(llm([{ name: "찌개", uses: [], extras: ["두부", "사골육수"] }]));

    const [menu] = await recommendMenus(["돼지고기"]);

    expect(menu.extraIngredients[1]).toEqual({
      name: "사골육수",
      canonical: null,
      packCost: null,
      packLabel: null,
      priceConfidence: null,
      hasPrice: false,
    });
    expect(menu.extraCost).toBe(1800);
    expect(menu.unpricedCount).toBe(1);
    expect(mocks.priceItem).toHaveBeenCalledTimes(1);
  });

  it("표준 재료지만 가격을 못 찾으면 0원으로 숨기지 않고 가격 미확인으로 둔다", async () => {
    const { recommendMenus } = await loadRecommend();
    mocks.canonicalize.mockReturnValue("계란");
    mocks.priceItem.mockResolvedValue({ pack: null, priceSource: null });
    mocks.generateJsonWithRetry.mockResolvedValue(llm([{ name: "찌개", uses: [], extras: ["계란"] }]));

    const [menu] = await recommendMenus(["돼지고기"]);

    expect(menu.extraIngredients[0]).toMatchObject({ canonical: "계란", packCost: null, hasPrice: false });
    expect(menu.extraCost).toBe(0);
    expect(menu.unpricedCount).toBe(1);
  });

  it("가격은 임의 수량이 아니라 구매 단위 정보만 쓰도록 1g 기준으로 조회한다", async () => {
    const { recommendMenus } = await loadRecommend();
    setPrices({ 두부: { price: 1800 } });
    mocks.generateJsonWithRetry.mockResolvedValue(llm([{ name: "찌개", uses: [], extras: ["두부"] }]));

    await recommendMenus(["돼지고기"]);

    expect(mocks.priceItem).toHaveBeenCalledWith({ name: "두부", qty: null, unit: null, amount: { value: 1, base: "g" } });
  });

  it("여러 메뉴가 같은 재료를 쓰면 가격은 한 번만 조회한다", async () => {
    const { recommendMenus } = await loadRecommend();
    setPrices({ 두부: { price: 1800 }, 양파: { price: 3900 } });
    mocks.generateJsonWithRetry.mockResolvedValue(
      llm([
        { name: "찌개", uses: [], extras: ["두부", "양파"] },
        { name: "조림", uses: [], extras: ["양파", "두부"] },
      ]),
    );

    await recommendMenus(["돼지고기"]);

    expect(mocks.priceItem).toHaveBeenCalledTimes(2);
  });

  it("추가 금액이 적은 순으로 정렬하고 같으면 가격 미확인이 적은 쪽이 먼저다", async () => {
    const { recommendMenus } = await loadRecommend();
    setPrices({ 두부: { price: 1800 }, 양파: { price: 3900 }, 대파: { price: 1800 } });
    mocks.generateJsonWithRetry.mockResolvedValue(
      llm([
        { name: "비싼 메뉴", uses: [], extras: ["양파"] },
        { name: "미확인 있는 메뉴", uses: [], extras: ["두부", "사골육수"] },
        { name: "바로 가능", uses: [], extras: [] },
        { name: "확인된 메뉴", uses: [], extras: ["대파"] },
      ]),
    );

    const menus = await recommendMenus(["돼지고기"]);

    expect(menus.map((menu) => menu.name)).toEqual(["바로 가능", "확인된 메뉴", "미확인 있는 메뉴", "비싼 메뉴"]);
  });
});

describe("recommendMenus: 결과 재사용", () => {
  const withMenu = () => llm([{ name: "찌개", uses: [], extras: [] }]);

  it("같은 재료 조합은 순서가 달라도 AI를 다시 부르지 않는다", async () => {
    const { recommendMenus } = await loadRecommend();
    mocks.generateJsonWithRetry.mockResolvedValue(withMenu());

    const first = await recommendMenus(["돼지고기", "신김치"]);
    const second = await recommendMenus(["신김치", "돼지고기"]);

    expect(mocks.generateJsonWithRetry).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it("다른 재료 조합은 새로 추천한다", async () => {
    const { recommendMenus } = await loadRecommend();
    mocks.generateJsonWithRetry.mockResolvedValue(withMenu());

    await recommendMenus(["돼지고기"]);
    await recommendMenus(["돼지고기", "두부"]);

    expect(mocks.generateJsonWithRetry).toHaveBeenCalledTimes(2);
  });

  it("보관 시간(1시간)이 지나면 시세가 바뀌었을 수 있으므로 다시 추천한다", async () => {
    const { recommendMenus, CACHE_TTL_MS } = await loadRecommend();
    vi.useFakeTimers();
    mocks.generateJsonWithRetry.mockResolvedValue(withMenu());

    await recommendMenus(["돼지고기"]);
    vi.advanceTimersByTime(CACHE_TTL_MS - 1);
    await recommendMenus(["돼지고기"]);
    expect(mocks.generateJsonWithRetry).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await recommendMenus(["돼지고기"]);
    expect(mocks.generateJsonWithRetry).toHaveBeenCalledTimes(2);
    expect(CACHE_TTL_MS).toBe(3_600_000);
  });

  it("추천이 비어 있으면 보관하지 않고 다음에 다시 시도한다", async () => {
    const { recommendMenus } = await loadRecommend();

    await recommendMenus(["돼지고기"]);
    await recommendMenus(["돼지고기"]);

    expect(mocks.generateJsonWithRetry).toHaveBeenCalledTimes(2);
  });

  it("보관은 50개까지이고 넘으면 가장 오래된 것부터 지운다", async () => {
    const { recommendMenus, CACHE_MAX } = await loadRecommend();
    mocks.generateJsonWithRetry.mockResolvedValue(withMenu());

    for (let index = 0; index < CACHE_MAX + 1; index += 1) await recommendMenus([`재료${index}`]);
    expect(mocks.generateJsonWithRetry).toHaveBeenCalledTimes(CACHE_MAX + 1);

    await recommendMenus(["재료0"]);
    expect(mocks.generateJsonWithRetry).toHaveBeenCalledTimes(CACHE_MAX + 2);

    await recommendMenus([`재료${CACHE_MAX}`]);
    expect(mocks.generateJsonWithRetry).toHaveBeenCalledTimes(CACHE_MAX + 2);
    expect(CACHE_MAX).toBe(50);
  });
});

describe("recommendMenus: 오류", () => {
  it("AI 호출이 실패하면 금액을 지어내지 않고 오류를 던진다", async () => {
    const { recommendMenus } = await loadRecommend();
    mocks.generateJsonWithRetry.mockRejectedValue(new Error("GEMINI 429"));

    await expect(recommendMenus(["돼지고기"])).rejects.toThrow("GEMINI 429");
  });

  it("모델 선택에 실패하면 오류를 던지고 다음 요청에서 다시 고른다", async () => {
    const { recommendMenus } = await loadRecommend();
    mocks.pickModels.mockRejectedValueOnce(new Error("GEMINI_API_KEY 환경변수가 없습니다."));
    mocks.generateJsonWithRetry.mockResolvedValue(llm([{ name: "찌개", uses: [], extras: [] }]));

    await expect(recommendMenus(["돼지고기"])).rejects.toThrow("GEMINI_API_KEY");
    await expect(recommendMenus(["돼지고기"])).resolves.toHaveLength(1);
    expect(mocks.pickModels).toHaveBeenCalledTimes(2);
  });
});
