import type { AxiosInstance } from "axios";
import { normalizeApiError } from "../errors/normalize-api-error";
import { pantryResponseSchema, type PantryResponse } from "../schemas/pantry";

export const PANTRY_REQUEST_TIMEOUT_MS = 60_000;

export const searchPantry = async (
  client: AxiosInstance,
  ingredients: string[],
): Promise<PantryResponse> => {
  const response = await client.post<unknown>(
    "/pantry",
    { ingredients },
    { timeout: PANTRY_REQUEST_TIMEOUT_MS },
  );

  try {
    return pantryResponseSchema.parse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};
