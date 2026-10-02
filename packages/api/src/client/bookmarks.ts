import type { AxiosInstance } from "axios";
import { z } from "zod";
import { normalizeApiError } from "../errors/normalize-api-error";
import {
  bookmarkListSchema,
  createBookmarkResponseSchema,
  type BookmarkList,
  type CreateBookmarkRequest,
  type CreateBookmarkResponse,
} from "../schemas/bookmarks";

const CREATE_RESULT_STATUSES = [200, 401, 409];

export const getBookmarks = async (client: AxiosInstance): Promise<BookmarkList> => {
  const response = await client.get<unknown>("/bookmarks");
  try {
    return bookmarkListSchema.parse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

export const createBookmark = async (
  client: AxiosInstance,
  input: CreateBookmarkRequest,
): Promise<CreateBookmarkResponse> => {
  const response = await client.post<unknown>("/bookmarks", input, {
    validateStatus: (status) => CREATE_RESULT_STATUSES.includes(status),
  });
  try {
    return createBookmarkResponseSchema.parse(response.data);
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
