import { ApiError, ApiRequestCanceledError } from "@recipe-web/api";
import { isCancelledError, type QueryClient } from "@tanstack/react-query";
import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getApiClient } from "@/lib/api-client";
import { dismissErrorNotification, getErrorNotification } from "@/lib/error-notification";
import { getQueryClient } from "@/lib/query-client";

const server = setupServer();
const clients = new Set<QueryClient>();
const clientForTest = () => {
  const client = getQueryClient();
  clients.add(client);
  return client;
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.clear();
  const notification = getErrorNotification();
  if (notification) dismissErrorNotification(notification.id);
  server.resetHandlers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("getQueryClient", () => {
  it("서버 호출 간 캐시를 공유하지 않는다", () => {
    const first = clientForTest();
    first.setQueryData(["session"], { id: 1 });
    const second = clientForTest();

    expect(first).not.toBe(second);
    expect(second.getQueryData(["session"])).toBeUndefined();
  });

  it("브라우저에서는 재호출해도 같은 캐시를 유지한다", () => {
    vi.stubGlobal("window", {});
    const first = clientForTest();
    first.setQueryData(["recipes"], [1]);

    expect(clientForTest()).toBe(first);
    expect(clientForTest().getQueryData(["recipes"])).toEqual([1]);
  });

  it("같은 키의 동시 요청과 1분 이내 재조회를 캐시로 처리한다", async () => {
    vi.useFakeTimers();
    const client = clientForTest();
    const queryFn = vi.fn(async () => [1]);
    const options = { queryKey: ["recipes"], queryFn };

    await Promise.all([client.fetchQuery(options), client.fetchQuery(options)]);
    await client.fetchQuery(options);
    expect(queryFn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60_001);
    await client.fetchQuery(options);
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("브라우저에서 사용하지 않는 캐시는 5분 후 제거한다", async () => {
    vi.stubGlobal("window", {});
    vi.useFakeTimers();
    const client = clientForTest();
    await client.fetchQuery({ queryKey: ["recipes"], queryFn: async () => [1] });

    await vi.advanceTimersByTimeAsync(5 * 60_000 - 1);
    expect(client.getQueryData(["recipes"])).toEqual([1]);
    await vi.advanceTimersByTimeAsync(1);
    expect(client.getQueryData(["recipes"])).toBeUndefined();
  });

  it.each([
    [new ApiError({ kind: "network" }), 2],
    [new ApiError({ kind: "timeout" }), 2],
    [new ApiError({ kind: "http", status: 500 }), 2],
    [new ApiError({ kind: "http", status: 503 }), 2],
    [new ApiError({ kind: "http", status: 400 }), 1],
    [new ApiError({ kind: "http", status: 401 }), 1],
    [new ApiError({ kind: "http", status: 404 }), 1],
    [new ApiError({ kind: "http", status: 429 }), 1],
    [new ApiError({ kind: "validation" }), 1],
    [new ApiError({ kind: "unknown" }), 1],
    [new ApiRequestCanceledError(), 1],
    [new Error("unexpected"), 1],
  ])("조회 실패 %s의 총 시도 횟수는 %i회다", async (error, attempts) => {
    const client = clientForTest();
    const queryFn = vi.fn().mockRejectedValue(error);

    await expect(client.fetchQuery({
      queryKey: ["retry"], queryFn, retryDelay: 0,
    })).rejects.toBe(error);
    expect(queryFn).toHaveBeenCalledTimes(attempts);
  });

  it("mutation은 서버 오류도 자동 재시도하지 않는다", async () => {
    const client = clientForTest();
    const error = new ApiError({ kind: "http", status: 503 });
    const mutationFn = vi.fn().mockRejectedValue(error);
    const mutation = client.getMutationCache().build(client, { mutationFn });

    await expect(mutation.execute(undefined)).rejects.toBe(error);
    expect(mutationFn).toHaveBeenCalledTimes(1);
  });

  it("첫 조회 실패는 로컬 처리하고 notify 모드에서만 공통 알림을 띄운다", async () => {
    vi.stubGlobal("window", {});
    const client = clientForTest();
    const error = new ApiError({ kind: "http", status: 403 });
    const queryFn = vi.fn().mockRejectedValue(error);

    await expect(client.fetchQuery({ queryKey: ["local"], queryFn, retry: false }))
      .rejects.toBe(error);
    expect(getErrorNotification()).toBeNull();

    await expect(client.fetchQuery({
      queryKey: ["notify"], queryFn, retry: false,
      meta: { errorMode: "notify" },
    })).rejects.toBe(error);
    expect(getErrorNotification()?.message).toBe(error.message);
  });

  it("boundary 모드는 데이터가 없는 실패만 오류 경계로 전달한다", () => {
    const client = clientForTest();
    const error = new ApiError({ kind: "http", status: 500 });
    const options = client.defaultQueryOptions({
      queryKey: ["boundary"], meta: { errorMode: "boundary" },
    });
    const query = client.getQueryCache().build(client, options);
    const shouldThrow = options.throwOnError;

    expect(typeof shouldThrow).toBe("function");
    if (typeof shouldThrow !== "function") return;
    expect(shouldThrow(error, query)).toBe(true);
    expect(shouldThrow(new ApiRequestCanceledError(), query)).toBe(false);
    client.setQueryData(["boundary"], { id: 1 });
    expect(shouldThrow(error, query)).toBe(false);
  });

  it("기존 데이터 갱신 실패는 데이터를 유지하고 한 번 알린다", async () => {
    vi.stubGlobal("window", {});
    const client = clientForTest();
    const error = new ApiError({ kind: "network" });
    client.setQueryData(["recipes"], [1]);

    await expect(client.fetchQuery({
      queryKey: ["recipes"], queryFn: async () => { throw error; },
      staleTime: 0, retry: false,
    })).rejects.toBe(error);
    expect(client.getQueryData(["recipes"])).toEqual([1]);
    expect(getErrorNotification()?.message).toBe(error.message);
  });

  it("mutation 실패는 기본 알림을 띄우고 local 모드는 알리지 않는다", async () => {
    vi.stubGlobal("window", {});
    const client = clientForTest();
    const error = new ApiError({ kind: "http", status: 400 });
    const mutationFn = vi.fn().mockRejectedValue(error);

    await expect(client.getMutationCache().build(client, { mutationFn })
      .execute(undefined)).rejects.toBe(error);
    expect(getErrorNotification()?.message).toBe(error.message);
    dismissErrorNotification(getErrorNotification()!.id);

    await expect(client.getMutationCache().build(client, {
      mutationFn, meta: { errorMode: "local" },
    }).execute(undefined)).rejects.toBe(error);
    expect(getErrorNotification()).toBeNull();
  });

  it("mutation 성공 후 관련 키만 무효화해 다음 조회에서 갱신한다", async () => {
    const client = clientForTest();
    const queryFn = vi.fn(async () => [1]);
    const options = { queryKey: ["recipes", "list"], queryFn };
    await client.fetchQuery(options);
    client.setQueryData(["profile"], { id: 1 });
    const mutation = client.getMutationCache().build(client, {
      mutationFn: async () => ({ id: 2 }),
      onSuccess: () => client.invalidateQueries({ queryKey: ["recipes"] }),
    });

    await mutation.execute(undefined);
    expect(client.getQueryState(options.queryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(["profile"])?.isInvalidated).toBe(false);
    await client.fetchQuery(options);
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("Query 취소 신호를 Axios에 전달해 진행 중 요청을 중단한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => { markStarted = resolve; });
    const handler = vi.fn(async () => {
      markStarted();
      await delay(200);
      return HttpResponse.json({ id: 1 });
    });
    server.use(http.get("https://api.example.test/recipes/1", handler));
    const client = clientForTest();
    let request!: Promise<unknown>;
    const result = client.fetchQuery({
      queryKey: ["recipes", 1],
      queryFn: async ({ signal }) => {
        const response = getApiClient().get("/recipes/1", { signal });
        request = response;
        return (await response).data;
      },
    }).catch((error: unknown) => error);

    await started;
    await client.cancelQueries({ queryKey: ["recipes", 1] });
    expect(isCancelledError(await result)).toBe(true);
    await expect(request).rejects.toBeInstanceOf(ApiRequestCanceledError);
    expect(client.getQueryState(["recipes", 1])?.fetchStatus).toBe("idle");
    expect(client.getQueryState(["recipes", 1])?.error).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
