import { z } from "zod";

export const bookmarkSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  sourceType: z.enum(["youtube", "manual"]),
  sourceUrl: z.string().nullable(),
  servings: z.number().int().positive(),
  createdAt: z.string(),
});

export const bookmarkListSchema = z.object({
  ok: z.literal(true),
  items: z.array(bookmarkSchema),
  count: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;
export type BookmarkList = z.infer<typeof bookmarkListSchema>;
