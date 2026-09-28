"use client";

import { useSyncExternalStore } from "react";

type ToastState = { id: number; message: string } | null;

const DURATION_MS = 2_600;

let state: ToastState = null;
let timeout: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;
const getServerSnapshot = () => null;

/**
 * 화면 아래 가운데에 토스트를 띄웁니다. 2.6초 뒤 자동으로 사라지며 닫기 버튼은 없습니다.
 * - **완료 알림 전용**입니다. 실패·오류에는 쓰지 않습니다.
 * - 연속 호출하면 쌓이지 않고 이전 문구를 교체하며, 2.6초를 다시 셉니다.
 * - 화면에 보이려면 앱 루트에 `ToastViewport`가 있어야 합니다.
 *
 * @param message 보여 줄 문구. 시안에 정해진 문구는 세 가지뿐입니다.
 * `"카카오 계정으로 로그인했습니다."` / `"로그아웃되었습니다."` / `"탈퇴가 완료되었습니다."`
 *
 * @example
 * showToast("로그아웃되었습니다.");
 */
export const showToast = (message: string) => {
  clearTimeout(timeout);
  state = { id: (state?.id ?? 0) + 1, message };
  emit();
  timeout = setTimeout(() => {
    state = null;
    emit();
  }, DURATION_MS);
};

/**
 * `showToast`로 띄운 토스트가 그려지는 자리. 앱 루트(layout)에 **한 번만** 렌더링합니다.
 * 두 번 렌더링하면 토스트가 두 개 겹쳐 보입니다.
 *
 * @example
 * // app/layout.tsx
 * <body>
 *   {children}
 *   <ToastViewport />
 * </body>
 */
export const ToastViewport = () => {
  const toast = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-7 left-1/2 z-30 -translate-x-1/2"
    >
      {toast && (
        <p
          key={toast.id}
          className="bg-text px-5.5 py-3.5 text-b3 leading-[1.4] font-medium whitespace-nowrap text-on-ink shadow-toast"
        >
          {toast.message}
        </p>
      )}
    </div>
  );
};
