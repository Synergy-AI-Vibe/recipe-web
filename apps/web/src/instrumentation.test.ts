import { afterEach, describe, expect, it, vi } from "vitest";

const setDefaultResultOrder = vi.hoisted(() => vi.fn());

vi.mock("node:dns", () => ({ setDefaultResultOrder }));

const loadRegister = async () => {
  vi.resetModules();
  return (await import("@/instrumentation")).register;
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("register", () => {
  it("노드 환경에서는 외부 호출이 IPv4를 먼저 쓰도록 설정한다", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    const register = await loadRegister();

    await register();

    expect(setDefaultResultOrder).toHaveBeenCalledWith("ipv4first");
  });

  it("다른 실행 환경에서는 아무것도 바꾸지 않는다", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");
    const register = await loadRegister();

    await register();

    expect(setDefaultResultOrder).not.toHaveBeenCalled();
  });
});
