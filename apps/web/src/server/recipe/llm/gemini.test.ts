import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const fetchMock = vi.fn();

const okResponse = (data: unknown) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(data) }] } }] }), {
    status: 200,
  });

const errorResponse = (status: number, message: string) => new Response(message, { status });

const loadGemini = async () => {
  vi.resetModules();
  return import("@/server/recipe/llm/gemini.js");
};

const request = { model: "m", system: "s", user: "u", schema: { type: "OBJECT" as const } };

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "single-key");
  vi.stubEnv("GEMINI_API_KEYS", "");
  vi.stubEnv("GOOGLE_API_KEY", "");
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

describe("generateJsonWithRetry", () => {
  it("성공하면 결과를 그대로 돌려준다", async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ menus: [] }));
    const { generateJsonWithRetry } = await loadGemini();

    const result = await generateJsonWithRetry(request);

    expect(result.data).toEqual({ menus: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("키가 없으면 호출하지 않고 오류를 낸다", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const { generateJsonWithRetry } = await loadGemini();

    await expect(generateJsonWithRetry(request)).rejects.toThrow("GEMINI_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("과부하(503)는 잠시 뒤 다시 시도해서 성공하면 결과를 쓴다", async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(503, "high demand")).mockResolvedValueOnce(okResponse({ ok: 1 }));
    const { generateJsonWithRetry } = await loadGemini();

    const result = await generateJsonWithRetry(request, { attempts: 2, baseDelay: 1 });

    expect(result.data).toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("정해진 횟수만큼 실패하면 마지막 오류를 그대로 던진다", async () => {
    fetchMock.mockImplementation(() => errorResponse(503, "high demand"));
    const { generateJsonWithRetry } = await loadGemini();

    await expect(generateJsonWithRetry(request, { attempts: 2, baseDelay: 1 })).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("할당량 소진(429 quota)은 기다려도 풀리지 않으므로 재시도하지 않는다", async () => {
    fetchMock.mockImplementation(() => errorResponse(429, "You exceeded your current quota"));
    const { generateJsonWithRetry } = await loadGemini();

    await expect(generateJsonWithRetry(request, { attempts: 4, baseDelay: 1 })).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("키가 여럿이면 할당량 소진 시 다음 키로 바로 다시 시도한다", async () => {
    vi.stubEnv("GEMINI_API_KEYS", "key-a,key-b");
    fetchMock
      .mockResolvedValueOnce(errorResponse(429, "You exceeded your current quota"))
      .mockResolvedValueOnce(okResponse({ ok: 1 }));
    const { generateJsonWithRetry } = await loadGemini();

    const result = await generateJsonWithRetry(request, { attempts: 4, baseDelay: 1 });

    expect(result.data).toEqual({ ok: 1 });
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls[0]).toContain("key=key-a");
    expect(urls[1]).toContain("key=key-b");
  });

  it("재시도할 수 없는 오류(400)는 바로 던진다", async () => {
    fetchMock.mockImplementation(() => errorResponse(400, "bad request"));
    const { generateJsonWithRetry } = await loadGemini();

    await expect(generateJsonWithRetry(request, { attempts: 4, baseDelay: 1 })).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
