import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ApiError, ApiRequestCanceledError, createApiClient } from "../index";

const baseURL = "https://api.example.test/v1";
const endpoint = `${baseURL}/recipes`;
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("createApiClient", () => {
  it("base path와 기본 설정을 적용하고 Axios 응답 구조를 유지한다", async () => {
    const body = { items: [{ id: 1 }] };
    server.use(http.get(endpoint, () => HttpResponse.json(body)));

    const client = createApiClient({ baseURL });
    const response = await client.get("/recipes");

    expect(response.data).toEqual(body);
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.config.timeout).toBe(10_000);
    expect(response.config.withCredentials).toBe(false);
  });

  it("요청별 헤더·params·credentials 설정을 전달한다", async () => {
    server.use(
      http.get(endpoint, ({ request }) =>
        HttpResponse.json({
          trace: request.headers.get("x-trace"),
          page: new URL(request.url).searchParams.get("page"),
        }),
      ),
    );
    const client = createApiClient({ baseURL });

    const response = await client.get("/recipes", {
      headers: { "X-Trace": "request-1" },
      params: { page: 2 },
      withCredentials: true,
      timeout: 500,
    });

    expect(response.data).toEqual({ trace: "request-1", page: "2" });
    expect(response.config.withCredentials).toBe(true);
    expect(response.config.timeout).toBe(500);
    expect(client.defaults.withCredentials).toBe(false);
  });

  it("생성 시 지정한 timeout과 credentials를 적용한다", async () => {
    server.use(http.get(endpoint, () => HttpResponse.json({ id: 1 })));
    const client = createApiClient({ baseURL, timeout: 700, withCredentials: true });

    const response = await client.get("/recipes");

    expect(response.config.timeout).toBe(700);
    expect(response.config.withCredentials).toBe(true);
  });

  it("JSON 요청 본문을 전달한다", async () => {
    server.use(
      http.post(endpoint, async ({ request }) =>
        HttpResponse.json(await request.json(), { status: 201 }),
      ),
    );

    const response = await createApiClient({ baseURL }).post("/recipes", {
      title: "recipe",
    });

    expect(response.status).toBe(201);
    expect(response.data).toEqual({ title: "recipe" });
  });

  it.each([400, 401, 403, 404, 429, 500, 503])(
    "HTTP %i를 정규화하고 자동 재시도하지 않는다",
    async (status) => {
      const handler = vi.fn(() =>
        HttpResponse.json({ message: "private-response" }, { status }),
      );
      server.use(http.get(endpoint, handler));

      const error = await createApiClient({ baseURL })
        .get("/recipes")
        .catch((reason: unknown) => reason);

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ kind: "http", status });
      expect(error).not.toHaveProperty("response");
      expect(handler).toHaveBeenCalledTimes(1);
    },
  );

  it("네트워크 실패를 정규화한다", async () => {
    server.use(http.get(endpoint, () => HttpResponse.error()));

    await expect(createApiClient({ baseURL }).get("/recipes")).rejects.toMatchObject({
      kind: "network",
    });
  });

  it("지연된 응답에 요청별 timeout을 적용한다", async () => {
    server.use(
      http.get(endpoint, async () => {
        await delay(200);
        return HttpResponse.json({ id: 1 });
      }),
    );

    await expect(
      createApiClient({ baseURL }).get("/recipes", { timeout: 30 }),
    ).rejects.toMatchObject({ kind: "timeout" });
  });

  it("이미 취소된 요청은 전송하지 않는다", async () => {
    const handler = vi.fn(() => HttpResponse.json({ id: 1 }));
    server.use(http.get(endpoint, handler));
    const controller = new AbortController();
    controller.abort();

    await expect(
      createApiClient({ baseURL }).get("/recipes", { signal: controller.signal }),
    ).rejects.toBeInstanceOf(ApiRequestCanceledError);
    expect(handler).not.toHaveBeenCalled();
  });

  it("진행 중 요청을 AbortSignal로 취소한다", async () => {
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    server.use(
      http.get(endpoint, async () => {
        markStarted();
        await delay(200);
        return HttpResponse.json({ id: 1 });
      }),
    );
    const controller = new AbortController();
    const client = createApiClient({ baseURL });
    const result = expect(
      client.get("/recipes", { signal: controller.signal }),
    ).rejects.toBeInstanceOf(ApiRequestCanceledError);

    await started;
    controller.abort();

    await result;
  });
});
