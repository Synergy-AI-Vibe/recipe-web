"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@recipe-web/ui";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useLoginDialogStore } from "@/store/login-dialog-store";

export const loginPendingKey = "recipe-web:login-pending";

export const LoginDialog = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const openRequest = useLoginDialogStore((state) => state.openRequest);
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    if (openRequest === 0 || dialogRef.current?.open) return;
    dialogRef.current?.showModal();
  }, [openRequest]);

  const startKakaoLogin = async () => {
    if (pending) return;
    setPending(true);
    setError(false);
    sessionStorage.setItem(loginPendingKey, "1");
    try {
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", `${window.location.pathname}${window.location.search}`);
      const { error: authError } = await getSupabaseClient().auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: redirectTo.toString() },
      });
      if (authError) throw authError;
    } catch {
      sessionStorage.removeItem(loginPendingKey);
      setPending(false);
      setError(true);
    }
  };

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-labelledby="login-title"
        aria-describedby="login-description"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="m-auto w-[calc(100%-40px)] max-w-115 border border-line bg-surface p-7 text-text shadow-xl backdrop:bg-scrim sm:p-9"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="login-title" className="text-h3">카카오로 시작하기</h2>
          <button type="button" onClick={close} aria-label="로그인 창 닫기" className="inline-flex h-8 w-8 items-center justify-center text-xl text-text-2 hover:text-text">×</button>
        </div>
        <p id="login-description" className="mt-4 text-b3 text-text-2">계산한 레시피를 북마크에 저장하고 이어서 볼 수 있습니다.</p>
        {error && <p role="alert" className="mt-4 text-b3 text-accent">카카오 로그인을 시작하지 못했습니다.</p>}
        <div className="mt-8">
          <Button variant="kakao" type="button" disabled={pending} onClick={startKakaoLogin}>
            {pending ? "로그인 중…" : "카카오로 3초 만에 시작하기"}
          </Button>
        </div>
        <p className="mt-4 text-c1 text-text-2">계속하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.</p>
      </dialog>
    </>
  );
};
