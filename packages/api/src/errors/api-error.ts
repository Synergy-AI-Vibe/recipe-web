export type ApiErrorKind =
  | "http"
  | "network"
  | "timeout"
  | "validation"
  | "unknown";

export type ApiErrorOptions =
  | { kind: "http"; status: number; code?: string }
  | { kind: Exclude<ApiErrorKind, "http">; status?: never; code?: never };

const getHttpMessage = (status: number): string => {
  switch (status) {
    case 400:
    case 422:
      return "입력한 내용을 확인해 주세요.";
    case 401:
      return "로그인이 필요합니다.";
    case 403:
      return "이 작업을 수행할 권한이 없습니다.";
    case 404:
      return "요청한 정보를 찾을 수 없습니다.";
    case 409:
      return "현재 상태에서는 요청을 처리할 수 없습니다. 내용을 확인해 주세요.";
    case 429:
      return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
    default:
      return status >= 500
        ? "서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
        : "요청을 처리하지 못했습니다.";
  }
};

const getErrorMessage = (options: ApiErrorOptions): string => {
  switch (options.kind) {
    case "http":
      return getHttpMessage(options.status);
    case "network":
      return "서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.";
    case "timeout":
      return "요청 시간이 초과되었습니다. 다시 시도해 주세요.";
    case "validation":
      return "서버 응답을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.";
    case "unknown":
      return "알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.";
  }
};

/** Carries only safe metadata; never retains the raw request or response. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;

  constructor(options: ApiErrorOptions) {
    super(getErrorMessage(options));
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code;
  }
}

/** Cancellation is control flow, not a failure to notify or retry. */
export class ApiRequestCanceledError extends Error {
  readonly kind = "canceled";

  constructor() {
    super("요청이 취소되었습니다.");
    this.name = "ApiRequestCanceledError";
  }
}

export type NormalizedApiError = ApiError | ApiRequestCanceledError;
