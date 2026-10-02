import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/auth/callback/route";

const NO_STORE = "private, no-cache, no-store, must-revalidate, max-age=0";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  responseHeaders: {} as Record<string, string>,
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabaseClient: async () => ({
    supabase: { auth: { exchangeCodeForSession: mocks.exchangeCodeForSession } },
    responseHeaders: mocks.responseHeaders,
  }),
}));

const callback = (query: string) => GET(new Request(`http://localhost:3000/auth/callback${query}`));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  Object.keys(mocks.responseHeaders).forEach((name) => delete mocks.responseHeaders[name]);
});

describe("GET /auth/callback", () => {
  it("로그인 코드를 세션으로 교환하고 원래 화면으로 돌려보낸다", async () => {
    const response = await callback("?code=abc&next=/result%3Furl%3Dhttps%3A%2F%2Fyoutu.be%2Fx");

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/result?url=https://youtu.be/x");
  });

  it("세션 쿠키가 만들어지면 캐시 방지 헤더를 이동 응답에 붙인다", async () => {
    mocks.exchangeCodeForSession.mockImplementation(async () => {
      Object.assign(mocks.responseHeaders, { "Cache-Control": NO_STORE, Expires: "0", Pragma: "no-cache" });
      return { error: null };
    });

    const response = await callback("?code=abc&next=/bookmarks");

    expect(response.headers.get("cache-control")).toBe(NO_STORE);
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("pragma")).toBe("no-cache");
  });

  it("교환에 실패하면 세션을 만들지 않고 원래 화면으로만 돌려보낸다", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: new Error("invalid code") });

    const response = await callback("?code=bad&next=/bookmarks");

    expect(response.headers.get("location")).toBe("http://localhost:3000/bookmarks");
    expect(response.headers.get("cache-control")).toBeNull();
  });

  it("코드가 없으면 교환을 시도하지 않고 홈으로 보낸다", async () => {
    const response = await callback("");

    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("다른 사이트로 보내는 주소는 홈으로 바꾼다", async () => {
    const targets = ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"];

    for (const target of targets) {
      const response = await callback(`?code=abc&next=${encodeURIComponent(target)}`);
      expect(response.headers.get("location"), target).toBe("http://localhost:3000/");
    }
  });
});
