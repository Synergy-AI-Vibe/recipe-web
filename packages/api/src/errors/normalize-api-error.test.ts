import { AxiosError, AxiosHeaders, CanceledError } from "axios";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  ApiError,
  ApiRequestCanceledError,
  isApiRequestCanceled,
  normalizeApiError,
} from "../index";

const createHttpError = (status: number) => {
  const config = {
    headers: new AxiosHeaders({ Authorization: "Bearer private-token" }),
    data: "private-request-body",
    url: "/private?token=private-token",
  };

  return new AxiosError(
    "private-server-message",
    AxiosError.ERR_BAD_RESPONSE,
    config,
    {},
    {
      status,
      statusText: "private-status-text",
      headers: new AxiosHeaders(),
      config,
      data: { code: "PRIVATE_CODE", message: "private-response-body" },
    },
  );
};

describe("normalizeApiError", () => {
  it.each([
    [400, "입력한 내용을 확인해 주세요."],
    [401, "로그인이 필요합니다."],
    [403, "이 작업을 수행할 권한이 없습니다."],
    [404, "요청한 정보를 찾을 수 없습니다."],
    [409, "현재 상태에서는 요청을 처리할 수 없습니다. 내용을 확인해 주세요."],
    [422, "입력한 내용을 확인해 주세요."],
    [429, "요청이 많습니다. 잠시 후 다시 시도해 주세요."],
    [418, "요청을 처리하지 못했습니다."],
    [500, "서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."],
    [503, "서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."],
  ])("HTTP %i를 안전한 메시지로 변환한다", (status, message) => {
    const error = normalizeApiError(createHttpError(status));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: "http", status, message });
  });

  it("원본 요청·응답·오류 메시지를 보관하거나 서버 envelope를 추측하지 않는다", () => {
    const error = normalizeApiError(createHttpError(500));

    expect(error).not.toHaveProperty("config");
    expect(error).not.toHaveProperty("request");
    expect(error).not.toHaveProperty("response");
    expect(error).not.toHaveProperty("cause");
    expect(error).toHaveProperty("code", undefined);
    expect(JSON.stringify(error)).not.toContain("private");
    expect(error.message).not.toContain("private");
    expect(error.stack).not.toContain("private-server-message");
  });

  it.each([AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT])(
    "%s 타임아웃을 네트워크 오류와 구분한다",
    (code) => {
      const error = normalizeApiError(new AxiosError("timeout", code, undefined, {}));

      expect(error).toMatchObject({ kind: "timeout", status: undefined });
    },
  );

  it("응답을 받은 오류에서는 HTTP 상태를 우선한다", () => {
    const source = createHttpError(504);
    source.code = AxiosError.ETIMEDOUT;

    expect(normalizeApiError(source)).toMatchObject({ kind: "http", status: 504 });
  });

  it.each([
    new AxiosError("network", AxiosError.ERR_NETWORK),
    new AxiosError("connection reset", "ECONNRESET", undefined, {}),
  ])("응답 없는 전송 실패를 네트워크 오류로 구분한다", (source) => {
    expect(normalizeApiError(source)).toMatchObject({ kind: "network" });
  });

  it("Axios 설정 오류는 네트워크 오류로 오인하지 않는다", () => {
    const source = new AxiosError("bad option", AxiosError.ERR_BAD_OPTION_VALUE);

    expect(normalizeApiError(source)).toMatchObject({ kind: "unknown" });
  });

  it("Zod 응답 검증 실패에서 원본 값을 노출하지 않는다", () => {
    const result = z.object({ id: z.number() }).safeParse({ id: "private-value" });
    if (result.success) throw new Error("Expected validation failure");

    const error = normalizeApiError(result.error);

    expect(error).toMatchObject({ kind: "validation" });
    expect(error).not.toHaveProperty("issues");
    expect(error.message).not.toContain("private-value");
  });

  it.each([new Error("private-message"), "private-string", null, undefined, 42, {}])(
    "알 수 없는 입력을 안전하게 정규화한다: %s",
    (source) => {
      const error = normalizeApiError(source);

      expect(error).toMatchObject({ kind: "unknown" });
      expect(error.message).not.toContain("private");
    },
  );

  it("이미 정규화된 오류와 명시적으로 제공한 업무 코드를 유지한다", () => {
    const error = new ApiError({ kind: "http", status: 409, code: "RECIPE_CONFLICT" });

    expect(normalizeApiError(error)).toBe(error);
    expect(error.code).toBe("RECIPE_CONFLICT");
    expect(error.message).not.toContain("RECIPE_CONFLICT");
  });
});

describe("request cancellation", () => {
  const abortError = new Error("private-abort-message");
  abortError.name = "AbortError";

  it.each([
    new CanceledError("private-cancel-message"),
    new AxiosError("private-cancel-message", AxiosError.ERR_CANCELED),
    abortError,
    new ApiRequestCanceledError(),
  ])("취소를 일반 오류와 구분하고 안전하게 정규화한다: %s", (source) => {
    const error = normalizeApiError(source);

    expect(isApiRequestCanceled(source)).toBe(true);
    expect(error).toBeInstanceOf(ApiRequestCanceledError);
    expect(error).not.toBeInstanceOf(ApiError);
    expect(isApiRequestCanceled(error)).toBe(true);
    expect(error.message).not.toContain("private");
    expect(normalizeApiError(error)).toBe(error);
  });

  it.each([new Error("canceled"), createHttpError(401), null])(
    "일반 실패를 취소로 처리하지 않는다: %s",
    (source) => {
      expect(isApiRequestCanceled(source)).toBe(false);
    },
  );
});
