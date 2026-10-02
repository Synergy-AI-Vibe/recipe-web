import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "@/app/api/bookmarks/[id]/route";
import { createFakeSupabase } from "@/test/fake-supabase";

vi.mock("server-only", () => ({}));

const state = vi.hoisted(() => ({ fake: undefined as unknown }));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabaseClient: async () => ({ supabase: state.fake, responseHeaders: {} }),
}));

const remove = (id: string) =>
  DELETE(new Request(`http://localhost/api/bookmarks/${id}`, { method: "DELETE" }), {
    params: Promise.resolve({ id }),
  });

const use = (options: Parameters<typeof createFakeSupabase>[0] = {}) => {
  const fake = createFakeSupabase({ result: { error: null }, ...options });
  state.fake = fake.supabase;
  return fake;
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DELETE /api/bookmarks/:id", () => {
  it("로그인하지 않으면 지우지 않고 401이다", async () => {
    const { query } = use({ user: null });

    const response = await remove("7");

    expect(response.status).toBe(401);
    expect(query.delete).not.toHaveBeenCalled();
  });

  it("해당 북마크를 확인 없이 바로 지운다", async () => {
    const { query } = use();

    const response = await remove("7");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(query.eq).toHaveBeenCalledWith("id", 7);
  });

  it.each(["abc", "1.5", "0", "-3", "7abc", ""])("잘못된 ID(%s)는 400이고 아무것도 지우지 않는다", async (id) => {
    const { query } = use();

    const response = await remove(id);

    expect(response.status).toBe(400);
    expect(query.delete).not.toHaveBeenCalled();
  });

  it("삭제에 실패하면 500이다", async () => {
    use({ result: { error: { message: "denied" } } });

    const response = await remove("7");

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ ok: false });
  });
});
