import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApiClient } from "./create-api-client";
import { analyzeRecipe } from "./analyze-recipe";

const server = setupServer();
const client = createApiClient({ baseURL: "https://api.example.test/api" });

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("analyzeRecipe", () => {
  it("유튜브 요청을 실제 서버 형식으로 보내고 성공 응답을 읽는다", async () => {
    server.use(
      http.post("https://api.example.test/api/analyze", async ({ request }) => {
        expect(await request.json()).toEqual({ url: "https://youtu.be/abc" });
        return HttpResponse.json({
          status: "success",
          data: { recipe: { title: "김치찌개" }, ingredients: [{ id: 1 }] },
        });
      }),
    );

    await expect(analyzeRecipe(client, { type: "youtube", url: "https://youtu.be/abc" }))
      .resolves.toMatchObject({ status: "success", data: { recipe: { title: "김치찌개" } } });
  });

  it("직접 입력 요청을 보내고 추출 실패 응답을 구분한다", async () => {
    server.use(
      http.post("https://api.example.test/api/analyze", async ({ request }) => {
        expect(await request.json()).toEqual({ text: "두부 1모" });
        return HttpResponse.json({
          status: "no_recipe_found",
          videoTitle: null,
          thumbnailUrl: null,
          message: "재료를 찾지 못했습니다",
        });
      }),
    );

    await expect(analyzeRecipe(client, { type: "text", text: "두부 1모" })).resolves.toMatchObject({
      status: "no_recipe_found",
    });
  });

  it("응답 형식이 다르면 검증 오류로 처리한다", async () => {
    server.use(
      http.post("https://api.example.test/api/analyze", () =>
        HttpResponse.json({ status: "success", data: { recipe: { title: "누락된 응답" } } }),
      ),
    );

    await expect(
      analyzeRecipe(client, { type: "youtube", url: "youtu.be/abc" }),
    ).rejects.toMatchObject({ kind: "validation" });
  });
});
