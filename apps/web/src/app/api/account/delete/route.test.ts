import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/account/delete/route";
import { createFakeSupabase, NO_STORE, TEST_USER } from "@/test/fake-supabase";

vi.mock("server-only", () => ({}));

const state = vi.hoisted(() => ({
  fake: undefined as unknown,
  responseHeaders: {} as Record<string, string>,
  deleteUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabaseClient: async () => ({ supabase: state.fake, responseHeaders: state.responseHeaders }),
}));

vi.mock("@/server/supabase/admin", () => ({
  getAdminSupabaseClient: () => ({ auth: { admin: { deleteUser: state.deleteUser } } }),
}));

const use = (options: Parameters<typeof createFakeSupabase>[0] = {}) => {
  const fake = createFakeSupabase(options);
  state.fake = fake.supabase;
  return fake;
};

beforeEach(() => {
  state.responseHeaders = {};
  state.deleteUser.mockResolvedValue({ error: null });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("POST /api/account/delete", () => {
  it("로그인하지 않으면 아무것도 지우지 않고 401이다", async () => {
    use({ user: null });

    const response = await POST();

    expect(response.status).toBe(401);
    expect(state.deleteUser).not.toHaveBeenCalled();
  });

  it("세션에서 확인한 사용자의 계정만 지우고 로그인 상태를 정리한다", async () => {
    const { auth } = use();

    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(state.deleteUser).toHaveBeenCalledTimes(1);
    expect(state.deleteUser).toHaveBeenCalledWith(TEST_USER.id);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("삭제에 실패하면 500이고 로그인 상태는 그대로 둔다", async () => {
    state.deleteUser.mockResolvedValue({ error: { message: "service unavailable" } });
    const { auth } = use();

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(JSON.stringify(body)).not.toContain("service unavailable");
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it("로그아웃 정리가 실패해도 탈퇴는 성공으로 본다", async () => {
    const { auth } = use();
    auth.signOut.mockRejectedValue(new Error("network"));

    const response = await POST();

    expect(response.status).toBe(200);
  });

  it("세션 갱신으로 받은 캐시 방지 헤더를 응답에 붙인다", async () => {
    use();
    state.responseHeaders = { "Cache-Control": NO_STORE };

    const response = await POST();

    expect(response.headers.get("cache-control")).toBe(NO_STORE);
  });
});
