import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pantryResponseSchema } from "@recipe-web/api";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ generateJsonWithRetry: vi.fn(), pickModels: vi.fn() }));

vi.mock("@/server/recipe/llm/gemini.js", () => ({
  generateJsonWithRetry: mocks.generateJsonWithRetry,
  pickModels: mocks.pickModels,
}));

const OFFLINE_ENV = [
  "KAMIS_CERT_KEY",
  "KAMIS_CERT_ID",
  "GEMINI_API_KEY",
  "GEMINI_API_KEYS",
  "GOOGLE_API_KEY",
  "NAVER_CLIENT_ID",
  "NAVER_CLIENT_SECRET",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
];

const fetchMock = vi.fn(async () => {
  throw new Error("network blocked");
});

const SCRIPTED = {
  menus: [
    { name: "두루치기", description: "매콤하게 볶습니다", uses: ["돼지고기"], extras: ["양파", "쌈장 소스", "당근"] },
    { name: "돼지고기 김치찌개", description: "돼지고기와 김치로 끓입니다", uses: ["돼지고기", "신김치", "마늘"], extras: ["두부", "대파", "양파"] },
    { name: "김치볶음밥", description: "신김치와 밥으로 만듭니다", uses: ["신김치"], extras: [] },
  ],
};

const loadRoute = async () => {
  vi.resetModules();
  return import("@/app/api/pantry/route");
};

const post = async (ingredients: string[]) => {
  const { POST } = await loadRoute();
  return POST(new Request("http://localhost/api/pantry", { method: "POST", body: JSON.stringify({ ingredients }) }));
};

beforeEach(() => {
  OFFLINE_ENV.forEach((name) => vi.stubEnv(name, ""));
  vi.stubEnv("LLM_PRICE", "0");
  vi.stubGlobal("fetch", fetchMock);
  mocks.pickModels.mockResolvedValue(["gemini-flash", "gemini-flash-lite"]);
  mocks.generateJsonWithRetry.mockResolvedValue({ data: SCRIPTED, model: "m", usage: { input: 1, output: 1, total: 2 } });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("POST /api/pantry: 라우트·추천·가격 파이프라인 전체 흐름 (AI와 외부 연결은 가짜)", () => {
  it("추가로 사야 하는 금액이 적은 순으로 메뉴를 돌려주고 화면이 읽을 수 있는 형식이다", async () => {
    const response = await post(["돼지고기", "신김치", "마늘"]);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(pantryResponseSchema.safeParse(body).success).toBe(true);
    expect(body.menus.map((menu: { name: string }) => menu.name)).toEqual(["김치볶음밥", "돼지고기 김치찌개", "두루치기"]);
  });

  it("바로 만들 수 있는 메뉴는 추가 금액이 0원이다", async () => {
    const { menus } = await (await post(["돼지고기", "신김치", "마늘"])).json();

    expect(menus[0]).toMatchObject({ name: "김치볶음밥", extraCost: 0, unpricedCount: 0, extraIngredients: [] });
  });

  it("부족한 재료는 실제 가격 파이프라인의 구매 단위 가격으로 합계를 낸다", async () => {
    const { menus } = await (await post(["돼지고기", "신김치", "마늘"])).json();
    const stew = menus.find((menu: { name: string }) => menu.name === "돼지고기 김치찌개");

    expect(stew.extraCost).toBe(7950);
    expect(stew.extraIngredients.map((extra: { name: string; packCost: number }) => [extra.name, extra.packCost])).toEqual([
      ["두부", 1800],
      ["대파", 2250],
      ["양파", 3900],
    ]);
    expect(stew.extraIngredients[0]).toMatchObject({ packLabel: "1모(300g) 1,800원", priceConfidence: "estimate", hasPrice: true });
  });

  it("외부 시세 키가 없으면 모든 금액을 추정으로 표시한다", async () => {
    const { menus } = await (await post(["돼지고기", "신김치", "마늘"])).json();

    menus
      .flatMap((menu: { extraIngredients: { priceConfidence: string | null; hasPrice: boolean }[] }) => menu.extraIngredients)
      .filter((extra: { hasPrice: boolean }) => extra.hasPrice)
      .forEach((extra: { priceConfidence: string | null }) => expect(extra.priceConfidence).toBe("estimate"));
  });

  it("입력한 재료만 쓰는 재료로 인정한다 (AI가 넣은 입력에 없는 재료는 제외)", async () => {
    const { menus } = await (await post(["돼지고기", "신김치"])).json();
    const stew = menus.find((menu: { name: string }) => menu.name === "돼지고기 김치찌개");

    expect(stew.usedIngredients).toEqual(["돼지고기", "신김치"]);
  });

  it("AI에 금액을 묻지 않는다 (가격 항목이 없는 요청 형식)", async () => {
    await post(["돼지고기", "신김치", "마늘"]);

    const [request] = mocks.generateJsonWithRetry.mock.calls[0];
    expect(JSON.stringify(request.schema)).not.toMatch(/price|cost|가격|금액/i);
  });

  it("같은 재료 조합을 다시 요청하면 AI를 다시 부르지 않는다", async () => {
    const { POST } = await loadRoute();
    const request = () => new Request("http://localhost/api/pantry", { method: "POST", body: JSON.stringify({ ingredients: ["돼지고기", "신김치", "마늘"] }) });

    await POST(request());
    await POST(request());

    expect(mocks.generateJsonWithRetry).toHaveBeenCalledTimes(1);
  });

  it("AI 키가 없어 모델을 고르지 못하면 추천 실패(502)로 안내한다", async () => {
    mocks.pickModels.mockRejectedValue(new Error("GEMINI_API_KEY 환경변수가 없습니다."));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await post(["돼지고기"]);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({ status: "error", reason: "failed" });
    expect(JSON.stringify(body)).not.toContain("GEMINI_API_KEY");
  });
});
