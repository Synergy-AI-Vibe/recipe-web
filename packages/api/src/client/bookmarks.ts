import type { AxiosInstance } from "axios";
import { z } from "zod";
import { normalizeApiError } from "../errors/normalize-api-error";
import { bookmarkListSchema, type BookmarkList } from "../schemas/bookmarks";

export const getBookmarks = async (client: AxiosInstance): Promise<BookmarkList> => {
  const response = await client.get<unknown>("/bookmarks");
  try {
    return bookmarkListSchema.parse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const deleteBookmark = async (client: AxiosInstance, id: number): Promise<void> => {
  const response = await client.delete<unknown>(`/bookmarks/${id}`);
  try {
    z.object({ ok: z.literal(true) }).parse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};
