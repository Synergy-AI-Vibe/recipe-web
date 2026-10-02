import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pantryResponseSchema } from "@recipe-web/api";
import { POST, maxDuration, runtime } from "@/app/api/pantry/route";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ recommendMenus: vi.fn() }));

vi.mock("@/server/pantry/recommend", () => ({ recommendMenus: mocks.recommendMenus }));

const MENU = {
  name: "김치찌개",
  description: "신김치와 돼지고기로 끓입니다",
  usedIngredients: ["돼지고기", "신김치"],
  extraIngredients: [
    { name: "두부", canonical: "두부", packCost: 1800, packLabel: "1모 1,800원", priceConfidence: "estimate", hasPrice: true },
  ],
  extraCost: 1800,
  unpricedCount: 0,
};

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/pantry", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));

beforeEach(() => {
  mocks.recommendMenus.mockResolvedValue([MENU]);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("POST /api/pantry: 실행 설정", () => {
  it("노드 환경에서 최대 60초까지 실행한다", () => {
    expect(runtime).toBe("nodejs");
    expect(maxDuration).toBe(60);
  });
});

describe("POST /api/pantry: 입력 검증", () => {
  it.each([
    ["JSON이 아닌 본문", "not json", "요청을 읽지 못했어요."],
    ["본문 없음", "null", "요청을 읽지 못했어요."],
    ["재료 목록이 없음", {}, "요청을 읽지 못했어요."],
    ["재료 목록이 배열이 아님", { ingredients: "돼지고기" }, "요청을 읽지 못했어요."],
    ["재료가 0개", { ingredients: [] }, "재료를 1개부터 5개까지 골라주세요."],
    ["공백·문자열이 아닌 값만 있음", { ingredients: ["  ", "", 1, null, { a: 1 }] }, "재료를 1개부터 5개까지 골라주세요."],
    ["재료가 6개", { ingredients: ["가", "나", "다", "라", "마", "바"] }, "재료를 1개부터 5개까지 골라주세요."],
    ["재료 이름이 11자", { ingredients: ["가나다라마바사아자차카"] }, "재료 이름은 10자까지 쓸 수 있어요."],
  ])("%s은 400이고 추천하지 않는다", async (_name, body, message) => {
    const response = await post(body);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "error", reason: "invalid_input", message });
    expect(mocks.recommendMenus).not.toHaveBeenCalled();
  });

  it("중복은 하나로 합쳐서 5개까지 받는다", async () => {
    const response = await post({ ingredients: ["가", "나", "다", "라", "마", "가", " 나 "] });

    expect(response.status).toBe(200);
    expect(mocks.recommendMenus).toHaveBeenCalledWith(["가", "나", "다", "라", "마"]);
  });

  it("정확히 10자인 재료 이름은 받는다", async () => {
    const response = await post({ ingredients: ["가나다라마바사아자차"] });

    expect(response.status).toBe(200);
  });

  it("앞뒤 공백은 지우고 문자열이 아닌 값은 버린다", async () => {
    await post({ ingredients: [" 돼지고기 ", 5, null, "신김치"] });

    expect(mocks.recommendMenus).toHaveBeenCalledWith(["돼지고기", "신김치"]);
  });
});

describe("POST /api/pantry: 결과", () => {
  it("추천 메뉴를 200으로 돌려주고 화면이 검증하는 형식과 일치한다", async () => {
    const response = await post({ ingredients: ["돼지고기", "신김치"] });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "success", menus: [MENU] });
    expect(pantryResponseSchema.safeParse(body).success).toBe(true);
  });

  it("추천할 메뉴가 없으면 오류가 아니라 정상 응답(200, no_menu)이다", async () => {
    mocks.recommendMenus.mockResolvedValue([]);

    const response = await post({ ingredients: ["돼지고기"] });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "error",
      reason: "no_menu",
      message: "이 조합으로는 추천을 만들지 못했어요. 재료를 바꿔 다시 시도해 주세요.",
    });
    expect(pantryResponseSchema.safeParse(body).success).toBe(true);
  });

  it("추천에 실패하면 내부 정보를 숨기고 502(failed)로 돌려준다", async () => {
    mocks.recommendMenus.mockRejectedValue(new Error("GEMINI 429 key=abc at https://secret.internal"));

    const response = await post({ ingredients: ["돼지고기"] });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      status: "error",
      reason: "failed",
      message: "추천을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    });
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(pantryResponseSchema.safeParse(body).success).toBe(true);
  });

  it("사과 표현 없이 다음 행동을 알려 준다", async () => {
    mocks.recommendMenus.mockRejectedValue(new Error("boom"));

    const body = await (await post({ ingredients: ["돼지고기"] })).json();

    expect(body.message).not.toMatch(/죄송|오류가 발생/);
    expect(body.message).toContain("다시 시도");
  });
});
