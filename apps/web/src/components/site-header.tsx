"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@recipe-web/ui";

export const SiteHeader = () => {
  const pathname = usePathname();
  const loginDialogRef = useRef<HTMLDialogElement>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const openLogin = () => {
    loginDialogRef.current?.showModal();
    setLoginOpen(true);
  };

  const closeLogin = () => loginDialogRef.current?.close();

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="container flex min-h-14.5 items-center justify-between gap-4">
          <Link href="/" className="text-h5 text-text" aria-label="레시비 홈">
            레시비
          </Link>
          <nav aria-label="주 메뉴" className="flex items-center gap-4 text-n1">
            <Link
              href="/pantry"
              aria-current={pathname === "/pantry" ? "page" : undefined}
              className={`inline-flex min-h-11 items-center font-medium hover:text-text focus-visible:outline-offset-2 ${pathname === "/pantry" ? "text-text" : "text-text-2"}`}
            >
              재료로 찾기
            </Link>
            <span aria-hidden="true" className="text-line-2">
              |
            </span>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={loginOpen}
              onClick={openLogin}
              className="inline-flex min-h-11 items-center font-bold text-text hover:text-accent"
            >
              로그인
            </button>
          </nav>
        </div>
      </header>

      <dialog
        ref={loginDialogRef}
        aria-labelledby="login-title"
        aria-describedby="login-description"
        onClose={() => setLoginOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeLogin();
        }}
        className="m-auto w-[calc(100%-40px)] max-w-115 border border-line bg-surface p-7 text-text shadow-xl backdrop:bg-scrim sm:p-9"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="login-title" className="text-h3">
            카카오로 시작하기
          </h2>
          <button
            type="button"
            onClick={closeLogin}
            aria-label="로그인 창 닫기"
            className="inline-flex h-8 w-8 items-center justify-center text-xl text-text-2 hover:text-text"
          >
            ×
          </button>
        </div>
        <p id="login-description" className="mt-4 text-b3 text-text-2">
          레시피를 북마크하려면 로그인이 필요합니다.
        </p>
        <form action="/api/auth/kakao" method="get" className="mt-8">
          <Button variant="kakao" type="submit">
            카카오로 3초 만에 시작하기
          </Button>
        </form>
        <p className="mt-4 text-c1 text-text-2">
          계속하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.
        </p>
      </dialog>
    </>
  );
};
