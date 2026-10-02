import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { config, proxy } from "@/proxy";

const updateSession = vi.hoisted(() => vi.fn());
vi.mock("@/server/supabase/update-session", () => ({ updateSession }));

const matcher = new RegExp(`^${config.matcher[0]}$`);

describe("proxy matcher", () => {
  it("화면과 API 요청에는 세션 갱신을 적용한다", () => {
    ["/", "/pantry", "/result", "/bookmarks", "/auth/callback", "/api/bookmarks"].forEach((path) =>
      expect(matcher.test(path), path).toBe(true),
    );
  });

  it("정적 파일과 이미지에는 적용하지 않는다", () => {
    ["/_next/static/chunks/a.js", "/_next/image", "/favicon.ico", "/logo.png", "/icon.svg"].forEach((path) =>
      expect(matcher.test(path), path).toBe(false),
    );
  });
});

describe("proxy", () => {
  it("요청마다 세션 갱신 함수에 넘긴다", async () => {
    const request = new NextRequest("http://localhost:3000/bookmarks");
    updateSession.mockResolvedValue("response");

    await expect(proxy(request)).resolves.toBe("response");
    expect(updateSession).toHaveBeenCalledWith(request);
  });
});
