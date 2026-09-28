import { ApiError, ApiRequestCanceledError } from "@recipe-web/api";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dismissErrorNotification,
  getErrorNotification,
  notifyError,
  subscribeErrorNotification,
} from "@/lib/error-notification";

afterEach(() => {
  const notification = getErrorNotification();
  if (notification) dismissErrorNotification(notification.id);
  vi.unstubAllGlobals();
});

describe("error notifications", () => {
  it("브라우저에서 안전한 API 메시지만 게시하고 구독자에게 알린다", () => {
    vi.stubGlobal("window", {});
    const listener = vi.fn();
    const unsubscribe = subscribeErrorNotification(listener);

    notifyError(new ApiError({ kind: "http", status: 403 }));
    expect(getErrorNotification()?.message).toBe("이 작업을 수행할 권한이 없습니다.");
    expect(listener).toHaveBeenCalledTimes(1);

    const firstId = getErrorNotification()!.id;
    notifyError(new Error("secret response"));
    expect(getErrorNotification()?.message).toBe("오류가 발생했습니다. 다시 시도해 주세요.");
    dismissErrorNotification(firstId);
    expect(getErrorNotification()).not.toBeNull();

    unsubscribe();
  });

  it("취소와 서버 실행은 알림으로 만들지 않는다", () => {
    notifyError(new ApiError({ kind: "network" }));
    expect(getErrorNotification()).toBeNull();

    vi.stubGlobal("window", {});
    notifyError(new ApiRequestCanceledError());
    expect(getErrorNotification()).toBeNull();
  });
});
