import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const createClient = vi.hoisted(() => vi.fn(() => ({ admin: true })));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

const loadAdmin = async () => {
  vi.resetModules();
  return (await import("@/server/supabase/admin")).getAdminSupabaseClient;
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.test");
  vi.stubEnv("SUPABASE_SECRET_KEY", "secret-key-value");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("getAdminSupabaseClient", () => {
  it("비밀 키로 세션을 저장하지 않는 관리자 클라이언트를 만든다", async () => {
    const getAdminSupabaseClient = await loadAdmin();

    getAdminSupabaseClient();

    expect(createClient).toHaveBeenCalledWith("https://project.supabase.test", "secret-key-value", {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  it("한 번 만든 클라이언트를 다시 쓴다", async () => {
    const getAdminSupabaseClient = await loadAdmin();

    expect(getAdminSupabaseClient()).toBe(getAdminSupabaseClient());
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it("비밀 키가 없으면 키 이름만 알리는 오류를 던진다", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    const getAdminSupabaseClient = await loadAdmin();

    expect(() => getAdminSupabaseClient()).toThrow("서버 환경 변수 SUPABASE_SECRET_KEY가 필요합니다.");
  });

  it("공개 주소가 없으면 오류를 던지고 비밀 키 값은 메시지에 담지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const getAdminSupabaseClient = await loadAdmin();

    expect(() => getAdminSupabaseClient()).toThrow("Supabase 공개 환경 변수가 필요합니다.");
    expect(() => getAdminSupabaseClient()).not.toThrow(/secret-key-value/);
  });
});
