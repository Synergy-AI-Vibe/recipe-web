import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_REFRESH_TIMEOUT_MS, updateSession } from "@/server/supabase/update-session";

type Cookie = { name: string; value: string; options?: object };
type CookieOptions = {
  getAll: () => { name: string; value: string }[];
  setAll: (items: Cookie[], headers: Record<string, string>) => void;
};

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getClaims: vi.fn(),
  cookies: undefined as CookieOptions | undefined,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (url: string, key: string, options: { cookies: CookieOptions }) => {
    mocks.cookies = options.cookies;
    mocks.createServerClient(url, key);
    return { auth: { getClaims: mocks.getClaims } };
  },
}));

const NO_STORE = "private, no-cache, no-store, must-revalidate, max-age=0";

const createRequest = () =>
  new NextRequest("http://localhost:3000/bookmarks", { headers: { cookie: "sb-access=old; theme=dark" } });

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable");
  mocks.getClaims.mockResolvedValue({ data: null, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  mocks.cookies = undefined;
});

describe("updateSession", () => {
  it("Supabase 공개 설정이 없으면 세션을 건드리지 않고 요청을 통과시킨다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    const response = await updateSession(createRequest());

    expect(response.status).toBe(200);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("공개 키로 로그인 정보를 확인해 세션 갱신 기회를 준다", async () => {
    await updateSession(createRequest());

    expect(mocks.createServerClient).toHaveBeenCalledWith("https://project.supabase.test", "publishable");
    expect(mocks.getClaims).toHaveBeenCalledTimes(1);
  });

  it("요청에 실린 쿠키를 Supabase에 전달한다", async () => {
    await updateSession(createRequest());

    expect(mocks.cookies?.getAll()).toEqual([
      { name: "sb-access", value: "old" },
      { name: "theme", value: "dark" },
    ]);
  });

  it("갱신된 세션 쿠키와 캐시 방지 헤더를 응답에 실어 보낸다", async () => {
    mocks.getClaims.mockImplementation(async () => {
      mocks.cookies?.setAll([{ name: "sb-access", value: "new", options: { path: "/", httpOnly: true } }], {
        "Cache-Control": NO_STORE,
        Expires: "0",
        Pragma: "no-cache",
      });
      return { data: null, error: null };
    });

    const response = await updateSession(createRequest());

    expect(response.cookies.get("sb-access")?.value).toBe("new");
    expect(response.headers.get("cache-control")).toBe(NO_STORE);
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("pragma")).toBe("no-cache");
  });

  it("쿠키를 갱신하지 않은 응답에는 캐시 방지 헤더를 붙이지 않는다", async () => {
    const response = await updateSession(createRequest());

    expect(response.headers.get("cache-control")).toBeNull();
  });

  it("Supabase 주소 형식이 잘못되어 접속 도구를 만들 수 없어도 요청은 통과시킨다", async () => {
    mocks.createServerClient.mockImplementation(() => {
      throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
    });

    const response = await updateSession(createRequest());

    expect(response.status).toBe(200);
  });

  it("로그인 정보 확인이 실패해도 요청은 통과시킨다", async () => {
    mocks.getClaims.mockRejectedValue(new Error("network"));

    const response = await updateSession(createRequest());

    expect(response.status).toBe(200);
  });

  it("Supabase 응답이 없어도 제한 시간 뒤에는 요청을 통과시킨다", async () => {
    vi.useFakeTimers();
    mocks.getClaims.mockReturnValue(new Promise(() => undefined));

    const pending = updateSession(createRequest());
    await vi.advanceTimersByTimeAsync(SESSION_REFRESH_TIMEOUT_MS);
    const response = await pending;
    vi.useRealTimers();

    expect(response.status).toBe(200);
  });

  it("제한 시간 안에 끝나면 대기 시간을 남기지 않는다", async () => {
    vi.useFakeTimers();

    const response = await updateSession(createRequest());

    expect(response.status).toBe(200);
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});
