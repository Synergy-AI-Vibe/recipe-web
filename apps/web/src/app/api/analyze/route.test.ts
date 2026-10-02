import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST, maxDuration, runtime } from "@/app/api/analyze/route";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ analyze: vi.fn(), toAnalyzeResponse: vi.fn() }));

vi.mock("@/server/recipe/analyze.js", () => ({ analyze: mocks.analyze }));
vi.mock("@/server/adapters/analyze", () => ({ toAnalyzeResponse: mocks.toAnalyzeResponse }));

const post = (body: unknown) =>
  POST(new Request("http://localhost/api/analyze", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));

const SUCCESS = { status: "success", data: { recipe: { title: "김치찌개" } } };

beforeEach(() => {
  mocks.analyze.mockResolvedValue({ pocResult: true });
  mocks.toAnalyzeResponse.mockResolvedValue(SUCCESS);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("POST /api/analyze: 실행 설정", () => {
  it("노드 환경에서 최대 60초까지 실행한다", () => {
    expect(runtime).toBe("nodejs");
    expect(maxDuration).toBe(60);
  });
});

describe("POST /api/analyze: 입력 검증", () => {
  it.each([
    ["JSON이 아닌 본문", "not json", "INVALID_INPUT"],
    ["본문 없음", "null", "INVALID_INPUT"],
    ["배열 본문", "[]", "INVALID_URL"],
    ["주소와 텍스트가 모두 없음", {}, "INVALID_URL"],
    ["공백만 있는 입력", { url: "   ", text: "  " }, "INVALID_URL"],
    ["문자열이 아닌 값", { url: 123, text: { a: 1 } }, "INVALID_URL"],
  ])("%s은 400이고 분석하지 않는다", async (_name, body, code) => {
    const response = await post(body);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ status: "error", code });
    expect(mocks.analyze).not.toHaveBeenCalled();
  });

  it("유튜브 주소가 아니면 400이고 분석하지 않는다", async () => {
    const response = await post({ url: "https://example.com/watch?v=abc" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      status: "error",
      code: "INVALID_URL",
      message: "유튜브 주소 형식이 아니에요.",
    });
    expect(mocks.analyze).not.toHaveBeenCalled();
  });

  it("텍스트가 20,000자를 넘으면 400이다", async () => {
    const response = await post({ text: "가".repeat(20001) });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      status: "error",
      code: "INVALID_INPUT",
      message: "레시피는 20,000자까지 넣을 수 있어요.",
    });
    expect(mocks.analyze).not.toHaveBeenCalled();
  });

  it("텍스트가 정확히 20,000자면 받는다", async () => {
    const response = await post({ text: "가".repeat(20000) });

    expect(response.status).toBe(200);
  });
});

describe("POST /api/analyze: 분석", () => {
  it("유튜브 주소는 앞뒤 공백을 지우고 주소로 분석한다", async () => {
    const response = await post({ url: "  https://youtu.be/abcdefghijk  " });

    expect(response.status).toBe(200);
    expect(mocks.analyze).toHaveBeenCalledWith({ url: "https://youtu.be/abcdefghijk" });
    expect(mocks.toAnalyzeResponse).toHaveBeenCalledWith({ pocResult: true }, { url: "https://youtu.be/abcdefghijk", text: undefined });
  });

  it("직접 입력 텍스트는 앞뒤 공백을 지우고 텍스트로 분석한다", async () => {
    await post({ text: "  돼지고기 200g  " });

    expect(mocks.analyze).toHaveBeenCalledWith({ text: "돼지고기 200g" });
    expect(mocks.toAnalyzeResponse).toHaveBeenCalledWith({ pocResult: true }, { url: undefined, text: "돼지고기 200g" });
  });

  it("주소와 텍스트가 함께 오면 주소로 분석한다", async () => {
    await post({ url: "https://youtu.be/abcdefghijk", text: "돼지고기 200g" });

    expect(mocks.analyze).toHaveBeenCalledWith({ url: "https://youtu.be/abcdefghijk" });
  });

  it("어댑터가 만든 응답을 그대로 200으로 돌려준다", async () => {
    const response = await post({ text: "돼지고기 200g" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(SUCCESS);
  });

  it("재료를 찾지 못한 결과도 정상 응답(200)이다", async () => {
    const notFound = { status: "no_recipe_found", videoTitle: null, thumbnailUrl: null, message: "찾지 못했어요" };
    mocks.toAnalyzeResponse.mockResolvedValue(notFound);

    const response = await post({ url: "https://youtu.be/abcdefghijk" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(notFound);
  });
});

describe("POST /api/analyze: 오류", () => {
  it("파이프라인이 입력 오류(400)를 던지면 그 문구와 함께 400으로 돌려준다", async () => {
    mocks.analyze.mockRejectedValue(Object.assign(new Error("url 또는 text가 필요합니다."), { statusCode: 400 }));

    const response = await post({ text: "무엇" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "error", code: "INVALID_URL", message: "url 또는 text가 필요합니다." });
  });

  it("그 밖의 예외는 내부 정보를 숨기고 500으로 돌려준다", async () => {
    mocks.analyze.mockRejectedValue(new Error("GEMINI 429 at https://secret.internal/key=abc"));

    const response = await post({ text: "무엇" });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      status: "error",
      code: "INTERNAL",
      message: "계산에 실패했어요. 잠시 후 다시 시도해 주세요.",
    });
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  it("어댑터에서 난 예외도 500으로 돌려준다", async () => {
    mocks.toAnalyzeResponse.mockRejectedValue(new Error("adapter failed"));

    const response = await post({ text: "무엇" });

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ status: "error", code: "INTERNAL" });
  });

  it("사과 표현 없이 다음 행동을 알려 준다", async () => {
    mocks.analyze.mockRejectedValue(new Error("boom"));

    const body = await (await post({ text: "무엇" })).json();

    expect(body.message).not.toMatch(/죄송|오류가 발생/);
    expect(body.message).toContain("다시 시도");
  });
});
