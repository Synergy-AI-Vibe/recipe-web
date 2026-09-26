import { ApiError, isApiRequestCanceled } from "@recipe-web/api";

type ErrorNotification = { id: number; message: string };

let current: ErrorNotification | null = null;
let nextId = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const subscribeErrorNotification = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getErrorNotification = () => current;
export const getServerErrorNotification = () => null;

export const dismissErrorNotification = (id: number) => {
  if (current?.id !== id) return;
  current = null;
  emit();
};

export const notifyError = (error: unknown) => {
  if (typeof window === "undefined" || isApiRequestCanceled(error)) return;

  current = {
    id: ++nextId,
    message: error instanceof ApiError
      ? error.message
      : "오류가 발생했습니다. 다시 시도해 주세요.",
  };
  emit();
};
