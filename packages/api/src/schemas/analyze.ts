import { z } from "zod";

/** 홈 입력 상태. API 서버에는 type 필드를 보내지 않는다. */
export const analyzeRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("youtube"), url: z.string() }),
  z.object({ type: z.literal("text"), text: z.string() }),
]);

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export const recipeSchema = z.object({
  title: z.string(),
  servings: z.number().positive(),
  sourceType: z.enum(["youtube", "manual"]),
  sourceUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  channelName: z.string().nullable(),
  steps: z.array(z.string()),
  rawText: z.string().nullable(),
});

export const ingredientRowSchema = z.object({
  id: z.number().int(),
  rawText: z.string(),
  name: z.string().nullable(),
  role: z.enum(["main", "seasoning"]),
  qty: z.number().nullable(),
  unit: z.string().nullable(),
  amount: z.number().nullable(),
  amountUnit: z.enum(["g", "ml", "ea"]).nullable(),
  conversionNote: z.string().nullable(),
  needsConfirm: z.boolean(),
  unitCost: z.number().nullable(),
  packCost: z.number().nullable(),
  packLabel: z.string().nullable(),
  priceTier: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
  priceConfidence: z.enum(["actual", "estimate", "user"]).nullable(),
  hasPrice: z.boolean(),
  checked: z.boolean(),
  userPrice: z.number().nullable(),
});

export const storePriceSchema = z.object({
  menuName: z.string(),
  min: z.number(),
  max: z.number(),
  avg: z.number(),
  deliveryFee: z.number(),
  sampleSize: z.number(),
  surveyedOn: z.string(),
});

export const totalsSchema = z.object({
  ingredientTotal: z.number(),
  basketTotal: z.number(),
  perServing: z.number(),
  savings: z.number(),
  savingsPercent: z.number(),
  barPercent: z.number(),
});

export const warningsSchema = z.object({
  missingMain: z.array(z.string()),
  missingSeasoning: z.array(z.string()),
  estimatedCount: z.number(),
  pricedCount: z.number(),
});

export const normalizeStatsSchema = z.object({
  total: z.number(),
  rule: z.number(),
  cache: z.number(),
  llm: z.number(),
  missed: z.number(),
  llmCalled: z.boolean(),
});

export const analyzeDataSchema = z.object({
  recipe: recipeSchema,
  ingredients: z.array(ingredientRowSchema),
  store: storePriceSchema.nullable(),
  totals: totalsSchema,
  warnings: warningsSchema,
  priceBaseDate: z.string(),
  normalize: normalizeStatsSchema.nullable(),
});

export const analyzeResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    data: analyzeDataSchema,
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

export type Recipe = z.infer<typeof recipeSchema>;
export type IngredientRow = z.infer<typeof ingredientRowSchema>;
export type StorePrice = z.infer<typeof storePriceSchema>;
export type Totals = z.infer<typeof totalsSchema>;
export type Warnings = z.infer<typeof warningsSchema>;
export type NormalizeStats = z.infer<typeof normalizeStatsSchema>;
export type AnalyzeData = z.infer<typeof analyzeDataSchema>;
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
