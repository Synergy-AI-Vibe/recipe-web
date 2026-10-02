import type { AxiosInstance } from "axios";
import { normalizeApiError } from "../errors/normalize-api-error";
import {
  analyzeResponseSchema,
  type AnalyzeRequest,
  type AnalyzeResponse,
} from "../schemas/analyze";

export const ANALYZE_REQUEST_TIMEOUT_MS = 60_000;

const RESULT_STATUSES = [400, 500];

export const analyzeRecipe = async (
  client: AxiosInstance,
  input: AnalyzeRequest,
): Promise<AnalyzeResponse> => {
  const payload = input.type === "youtube" ? { url: input.url } : { text: input.text };
  const response = await client.post<unknown>("/analyze", payload, {
    timeout: ANALYZE_REQUEST_TIMEOUT_MS,
    validateStatus: (status) => (status >= 200 && status < 300) || RESULT_STATUSES.includes(status),
  });

  try {
    return analyzeResponseSchema.parse(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};
