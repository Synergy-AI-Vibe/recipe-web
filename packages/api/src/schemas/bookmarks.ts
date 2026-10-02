import { z } from "zod";

export const BOOKMARK_LIMIT = 5;
export const BOOKMARK_TITLE_MAX_LENGTH = 200;
export const BOOKMARK_RAW_TEXT_MAX_LENGTH = 20000;
export const BOOKMARK_SERVINGS_MAX = 100;

export const bookmarkSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  sourceType: z.enum(["youtube", "manual"]),
  sourceUrl: z.string().nullable(),
  servings: z.number().int().positive(),
  rawText: z.string().nullable().default(null),
  createdAt: z.string(),
});

export const bookmarkListSchema = z.object({
  ok: z.literal(true),
  items: z.array(bookmarkSchema),
  count: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

const bookmarkBaseSchema = z.object({
  title: z.string().trim().min(1).max(BOOKMARK_TITLE_MAX_LENGTH),
  servings: z.number().int().positive().max(BOOKMARK_SERVINGS_MAX),
});

export const createBookmarkRequestSchema = z.discriminatedUnion("sourceType", [
  bookmarkBaseSchema.extend({
    sourceType: z.literal("youtube"),
    sourceUrl: z.string().trim().min(1),
    rawText: z.null().optional(),
  }),
  bookmarkBaseSchema.extend({
    sourceType: z.literal("manual"),
    sourceUrl: z.null().optional(),
    rawText: z.string().trim().min(1).max(BOOKMARK_RAW_TEXT_MAX_LENGTH),
  }),
]);

export const createBookmarkFailureReasonSchema = z.enum(["unauthorized", "limit", "duplicate", "error"]);

export const createBookmarkResponseSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), bookmark: bookmarkSchema }),
  z.object({
    ok: z.literal(false),
    reason: createBookmarkFailureReasonSchema,
    message: z.string(),
  }),
]);

export type Bookmark = z.infer<typeof bookmarkSchema>;
export type BookmarkList = z.infer<typeof bookmarkListSchema>;
export type CreateBookmarkRequest = z.infer<typeof createBookmarkRequestSchema>;
export type CreateBookmarkFailureReason = z.infer<typeof createBookmarkFailureReasonSchema>;
export type CreateBookmarkResponse = z.infer<typeof createBookmarkResponseSchema>;
