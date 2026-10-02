import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerEnv, requireServerEnv, SERVER_ENV_KEYS } from "@/server/env";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getServerEnv", () => {
  it("설정된 값을 앞뒤 공백 없이 돌려준다", () => {
    vi.stubEnv("GEMINI_API_KEY", "  abc  ");

    expect(getServerEnv("GEMINI_API_KEY")).toBe("abc");
  });

  it("없거나 비어 있으면 undefined다", () => {
    vi.stubEnv("YOUTUBE_API_KEY", "");
    vi.stubEnv("KAMIS_CERT_KEY", "   ");

    expect(getServerEnv("YOUTUBE_API_KEY")).toBeUndefined();
    expect(getServerEnv("KAMIS_CERT_KEY")).toBeUndefined();
    expect(getServerEnv("KAMIS_CERT_ID")).toBeUndefined();
  });
});

describe("requireServerEnv", () => {
  it("값이 있으면 돌려준다", () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "secret-value");

    expect(requireServerEnv("SUPABASE_SECRET_KEY")).toBe("secret-value");
  });

  it("값이 없으면 어떤 키가 필요한지만 알리는 오류를 던진다", () => {
    vi.stubEnv("PRICE_GO_SERVICE_KEY", "");

    expect(() => requireServerEnv("PRICE_GO_SERVICE_KEY")).toThrow(
      "서버 환경 변수 PRICE_GO_SERVICE_KEY가 필요합니다.",
    );
  });
});

describe(".env.example", () => {
  const example = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
  const keys = example
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => line.split("=")[0]);

  it("서버 전용 키를 모두 설명한다", () => {
    SERVER_ENV_KEYS.forEach((key) => expect(keys).toContain(key));
  });

  it("공개 Supabase 키 2개를 설명한다", () => {
    expect(keys).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(keys).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });

  it("코드가 읽지 않는 API 주소 설정은 없다", () => {
    expect(keys).not.toContain("NEXT_PUBLIC_API_BASE_URL");
  });

  it("서버 전용 키는 공개 접두어를 쓰지 않는다", () => {
    SERVER_ENV_KEYS.forEach((key) => expect(key.startsWith("NEXT_PUBLIC_")).toBe(false));
  });

  it("실제 값은 담지 않는다", () => {
    const assigned = example.split(/\r?\n/).filter((line) => /^[A-Z_]+=.+/.test(line));

    expect(assigned).toEqual([]);
  });
});
