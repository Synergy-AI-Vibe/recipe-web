import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { describeKey, loadEnv } from "@/server/recipe/env.js";
import { analyze } from "@/server/recipe/analyze.js";
import { canonicalize } from "@/server/recipe/price/index.js";

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

const RECIPE = ["돼지고기 200g", "신김치 300g", "두부 1/2모", "대파 1대", "고춧가루 2큰술", "사골육수 1팩"].join("\n");

const fetchMock = vi.fn(async () => {
  throw new Error("network blocked");
});

beforeEach(() => {
  OFFLINE_ENV.forEach((name) => vi.stubEnv(name, ""));
  vi.stubEnv("LLM_PRICE", "0");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockClear();
});

describe("이식한 분석 파이프라인 (외부 연결 없이)", () => {
  it("직접 입력 레시피를 외부 호출 없이 끝까지 계산한다", async () => {
    const result = await analyze({ text: RECIPE });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.fetched).toMatchObject({ ok: true, source: "manual" });
    expect(result.pricing.items).toHaveLength(6);
  });

  it("재료를 표준 이름으로 바꾸고 환산 근거를 남긴다", async () => {
    const { pricing } = await analyze({ text: RECIPE });
    const byRaw = Object.fromEntries(pricing.items.map((item) => [item.raw, item]));

    expect(byRaw["돼지고기 200g"]).toMatchObject({ canonical: "돼지고기", category: "주재료" });
    expect(byRaw["신김치 300g"].canonical).toBe("김치");
    expect(byRaw["두부 1/2모"].amount).toMatchObject({ value: 150, base: "g", basis: "두부 1모 ≈ 300g 기준" });
    expect(byRaw["대파 1대"].amount).toMatchObject({ value: 100, base: "g" });
    expect(byRaw["고춧가루 2큰술"]).toMatchObject({ category: "조미료", amount: { value: 30, base: "ml" } });
  });

  it("재료별 소모 원가와 구매 단위 가격을 시드 가격으로 계산한다", async () => {
    const { pricing } = await analyze({ text: RECIPE });
    const costs = Object.fromEntries(pricing.items.map((item) => [item.raw, [item.cost, item.packCost]]));

    expect(costs["돼지고기 200g"]).toEqual([3700, 9250]);
    expect(costs["신김치 300g"]).toEqual([2400, 8000]);
    expect(costs["두부 1/2모"]).toEqual([900, 1800]);
    expect(costs["대파 1대"]).toEqual([450, 2250]);
    expect(costs["고춧가루 2큰술"]).toEqual([960, 8000]);
    expect(pricing.summary).toMatchObject({ consumedCost: 8410, basketCost: 29300, coverage: 83 });
  });

  it("외부 시세 키가 없으면 모든 가격을 추정치(시드)로 표시한다", async () => {
    const { pricing } = await analyze({ text: RECIPE });

    pricing.items
      .filter((item) => item.cost !== null)
      .forEach((item) => expect(item.priceSource).toMatchObject({ tier: 1, live: false }));
  });

  it("가격을 찾지 못한 재료는 0원으로 숨기지 않고 비워 둔다", async () => {
    const { pricing } = await analyze({ text: RECIPE });
    const unknown = pricing.items.find((item) => item.raw === "사골육수 1팩");

    expect(unknown).toMatchObject({ cost: null, packCost: null, amount: null });
  });

  it("규칙만으로 풀린 이름은 외부 정규화를 부르지 않는다", async () => {
    const { normalize } = await analyze({ text: RECIPE });

    expect(normalize).toMatchObject({ total: 6, rule: 6, llm: 0, missed: 0, llmCalled: false });
  });

  it("입력이 없으면 400 오류를 던진다", async () => {
    await expect(analyze({})).rejects.toMatchObject({ statusCode: 400 });
  });

  it("인분이 적혀 있지 않으면 1인분으로 본다", async () => {
    const { servings } = await analyze({ text: RECIPE });

    expect(servings).toMatchObject({ used: 1, source: "default" });
  });
});

describe("별칭 규칙 (MVP 지시서 1-2: 앵커 금지)", () => {
  it("수식어가 앞에 붙은 표기도 표준 재료로 찾는다", () => {
    expect(canonicalize("통삼겹")).toBe("돼지고기");
    expect(canonicalize("다진마늘")).toBe("마늘");
  });

  it("규칙에 없는 이름은 null이다", () => {
    expect(canonicalize("동전육수")).toBeNull();
  });
});

describe("env.js 대체본", () => {
  it(".env 파일을 읽지 않는다", () => {
    expect(loadEnv()).toEqual({ loaded: false, keys: [] });
  });

  it("키 설정 여부만 알리고 값은 드러내지 않는다", () => {
    vi.stubEnv("GEMINI_API_KEY", "super-secret-value");

    expect(describeKey("GEMINI_API_KEY")).toBe("GEMINI_API_KEY: 설정됨");
    expect(describeKey("GEMINI_API_KEY")).not.toContain("secret");
    expect(describeKey("YOUTUBE_API_KEY")).toBe("YOUTUBE_API_KEY: 없음");
  });
});
