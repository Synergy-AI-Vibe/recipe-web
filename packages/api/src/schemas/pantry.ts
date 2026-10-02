import { z } from "zod";

export const PANTRY_MIN_INGREDIENTS = 1;
export const PANTRY_MAX_INGREDIENTS = 5;
export const PANTRY_MAX_NAME_LENGTH = 10;

export const pantryRequestSchema = z.object({
  ingredients: z
    .array(z.string().min(1).max(PANTRY_MAX_NAME_LENGTH))
    .min(PANTRY_MIN_INGREDIENTS)
    .max(PANTRY_MAX_INGREDIENTS),
});

export const pantryExtraIngredientSchema = z.object({
  name: z.string(),
  canonical: z.string().nullable(),
  packCost: z.number().nullable(),
  packLabel: z.string().nullable(),
  priceConfidence: z.enum(["actual", "estimate"]).nullable(),
  hasPrice: z.boolean(),
});

export const pantryMenuSchema = z.object({
  name: z.string(),
  description: z.string(),
  usedIngredients: z.array(z.string()),
  extraIngredients: z.array(pantryExtraIngredientSchema),
  extraCost: z.number(),
  unpricedCount: z.number().int().nonnegative(),
});

export const pantryErrorReasonSchema = z.enum(["invalid_input", "no_menu", "failed"]);

export const pantryResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), menus: z.array(pantryMenuSchema) }),
  z.object({
    status: z.literal("error"),
    reason: pantryErrorReasonSchema,
    message: z.string(),
  }),
]);

export type PantryRequest = z.infer<typeof pantryRequestSchema>;
export type PantryExtraIngredient = z.infer<typeof pantryExtraIngredientSchema>;
export type PantryMenu = z.infer<typeof pantryMenuSchema>;
export type PantryErrorReason = z.infer<typeof pantryErrorReasonSchema>;
export type PantryResponse = z.infer<typeof pantryResponseSchema>;
