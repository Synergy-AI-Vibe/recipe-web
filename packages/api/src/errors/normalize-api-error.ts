import { AxiosError, isAxiosError, isCancel } from "axios";
import { ZodError } from "zod";
import {
  ApiError,
  ApiRequestCanceledError,
  type NormalizedApiError,
} from "./api-error";

export const isApiRequestCanceled = (error: unknown): boolean =>
  error instanceof ApiRequestCanceledError ||
  isCancel(error) ||
  (isAxiosError(error) && error.code === AxiosError.ERR_CANCELED) ||
  (error instanceof Error && error.name === "AbortError");

/** Use for HTTP calls and response validation, not client-side form validation. */
export const normalizeApiError = (error: unknown): NormalizedApiError => {
  if (error instanceof ApiError || error instanceof ApiRequestCanceledError) {
    return error;
  }

  if (isApiRequestCanceled(error)) {
    return new ApiRequestCanceledError();
  }

  if (error instanceof ZodError) {
    return new ApiError({ kind: "validation" });
  }

  if (isAxiosError(error)) {
    if (error.response) {
      return new ApiError({ kind: "http", status: error.response.status });
    }

    if (
      error.code === AxiosError.ECONNABORTED ||
      error.code === AxiosError.ETIMEDOUT
    ) {
      return new ApiError({ kind: "timeout" });
    }

    if (error.code === AxiosError.ERR_NETWORK || error.request != null) {
      return new ApiError({ kind: "network" });
    }
  }

  return new ApiError({ kind: "unknown" });
};
