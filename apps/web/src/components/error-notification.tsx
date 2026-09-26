"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  dismissErrorNotification,
  getErrorNotification,
  getServerErrorNotification,
  subscribeErrorNotification,
} from "@/lib/error-notification";

export const ErrorNotification = () => {
  const notification = useSyncExternalStore(
    subscribeErrorNotification,
    getErrorNotification,
    getServerErrorNotification,
  );

  useEffect(() => {
    if (!notification) return;
    const timeout = window.setTimeout(
      () => dismissErrorNotification(notification.id),
      5_000,
    );
    return () => window.clearTimeout(timeout);
  }, [notification]);

  if (!notification) return null;

  return (
    <div role="alert" className="fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-4 rounded-lg bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
      <p>{notification.message}</p>
      <button
        type="button"
        aria-label="알림 닫기"
        onClick={() => dismissErrorNotification(notification.id)}
        className="shrink-0 rounded px-2 py-1 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current dark:hover:bg-black/10"
      >
        닫기
      </button>
    </div>
  );
};
