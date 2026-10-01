import { z } from "zod";

/** 홈 입력 상태. API 서버에는 type 필드를 보내지 않는다. */
export const analyzeRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("youtube"), url: z.string() }),
  z.object({ type: z.literal("text"), text: z.string() }),
]);

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

/** 현재 홈 화면에서 사용하는 서버 응답 필드. 결과 화면은 다음 단계에서 확장한다. */
export const analyzeResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    data: z.object({
      recipe: z.object({ title: z.string() }),
      ingredients: z.array(z.unknown()),
    }),
  }),
  z.object({
    status: z.literal("no_recipe_found"),
    videoTitle: z.string().nullable(),
    thumbnailUrl: z.string().nullable(),
    message: z.string(),
  }),
  z.object({
    status: z.literal("error"),
    code: z.string(),
    message: z.string(),
  }),
]);

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
