import type { AxiosInstance } from "axios";
import { normalizeApiError } from "../errors/normalize-api-error";
import {
  analyzeResponseSchema,
  type AnalyzeRequest,
  type AnalyzeResponse,
} from "../schemas/analyze";

export const analyzeRecipe = async (
  client: AxiosInstance,
  input: AnalyzeRequest,
): Promise<AnalyzeResponse> => {
  const payload = input.type === "youtube" ? { url: input.url } : { text: input.text };
  const response = await client.post<unknown>("/analyze", payload);

  try {
    return analyzeResponseSchema.parse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};
