import type { AxiosInstance } from "axios";
import { z } from "zod";
import { normalizeApiError } from "../errors/normalize-api-error";

export const deleteAccount = async (client: AxiosInstance): Promise<void> => {
  await client.post("/account/delete");
};

export const getBookmarkCount = async (client: AxiosInstance): Promise<number> => {
  const response = await client.get<unknown>("/bookmarks");
  try {
    return z.object({ ok: z.literal(true), items: z.array(z.unknown()) }).parse(response.data).items.length;
  } catch (error) {
    throw normalizeApiError(error);
  }
};
