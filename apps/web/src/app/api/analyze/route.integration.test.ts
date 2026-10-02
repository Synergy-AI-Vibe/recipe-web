import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeResponseSchema } from "@recipe-web/api";
import { POST } from "@/app/api/analyze/route";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ estimateStorePrice: vi.fn(), matchStorePrice: vi.fn() }));

vi.mock("@/server/recipe/price/llm-store-price.js", () => ({ estimateStorePrice: mocks.estimateStorePrice }));
vi.mock("@/server/data/store-price", () => ({ matchStorePrice: mocks.matchStorePrice }));

const OFFLINE_ENV = [
  "KAMIS_CERT_KEY",
  "KAMIS_CERT_ID",
  "GEMINI_API_KEY",
  "GEMINI_API_KEYS",
  "GOOGLE_API_KEY",
  "YOUTUBE_API_KEY",
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

const RECIPE = ["돼지고기 200g", "신김치 300g", "두부 1/2모", "대파 1대", "고춧가루 2큰술", "사골육수 1팩"].join("\n");

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/analyze", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  OFFLINE_ENV.forEach((name) => vi.stubEnv(name, ""));
  vi.stubEnv("LLM_PRICE", "0");
  vi.stubGlobal("fetch", fetchMock);
  mocks.estimateStorePrice.mockResolvedValue({
    menuName: "김치찌개",
    min: 16000,
    max: 22000,
    avg: 19000,
    deliveryFee: 3000,
    sampleSize: 12,
    surveyedOn: "2026-09-01",
  });
  mocks.matchStorePrice.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("POST /api/analyze: 파이프라인·어댑터·라우트 전체 흐름 (외부 연결 없이)", () => {
  it("직접 입력 레시피를 끝까지 계산해 화면이 읽을 수 있는 형식으로 응답한다", async () => {
    const response = await post({ text: RECIPE });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(analyzeResponseSchema.safeParse(body).success).toBe(true);
    expect(body.status).toBe("success");
  });

  it("재료 6개, 합계 8,410원이고 직접 입력은 사 먹는 가격이 없어 절약 금액은 0원이다", async () => {
    const { data } = await (await post({ text: RECIPE })).json();

    expect(data.ingredients).toHaveLength(6);
    expect(data.totals).toMatchObject({ ingredientTotal: 8410, perServing: 8410, savings: 0 });
    expect(data.store).toBeNull();
    expect(mocks.estimateStorePrice).not.toHaveBeenCalled();
  });

  it("가격을 찾지 못한 재료는 경고에 담고 직접 입력 대상으로 표시한다", async () => {
    const { data } = await (await post({ text: RECIPE })).json();
    const unknown = data.ingredients.find((row: { rawText: string }) => row.rawText === "사골육수 1팩");

    expect(unknown).toMatchObject({ hasPrice: false, needsConfirm: true, unitCost: null, packCost: null });
    expect(data.warnings.missingSeasoning).toEqual(["사골육수"]);
  });

  it("직접 입력은 출처 종류와 제목을 직접 입력으로 표시한다", async () => {
    const { data } = await (await post({ text: RECIPE })).json();

    expect(data.recipe).toMatchObject({ sourceType: "manual", title: "직접 입력", sourceUrl: null, rawText: null });
  });

  it("가격 기준 정보는 외부 시세가 없으면 시드 기준임을 추정으로 알린다", async () => {
    const { data } = await (await post({ text: RECIPE })).json();
    const priced = data.ingredients.filter((row: { hasPrice: boolean }) => row.hasPrice);

    expect(priced.length).toBeGreaterThan(0);
    priced.forEach((row: { priceConfidence: string }) => expect(row.priceConfidence).toBe("estimate"));
  });

  it("재료가 없는 문장은 재료를 찾지 못했다는 정상 응답으로 돌려준다", async () => {
    const response = await post({ text: "오늘 날씨가 좋네요" });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(analyzeResponseSchema.safeParse(body).success).toBe(true);
    expect(body.status).toBe("no_recipe_found");
  });
});
