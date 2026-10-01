"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { showToast } from "@recipe-web/ui";
import { AccountMenu } from "@/components/account-menu";
import { LoginDialog, loginPendingKey } from "@/components/login-dialog";
import { useSession } from "@/hooks/use-session";

export const SiteHeader = () => {
  const pathname = usePathname();
  const session = useSession();

  useEffect(() => {
    if (!session.isSuccess || sessionStorage.getItem(loginPendingKey) !== "1") return;
    sessionStorage.removeItem(loginPendingKey);
    if (session.data.authenticated) showToast("카카오 계정으로 로그인했습니다.");
  }, [session.isSuccess, session.data]);

  return (
    <header className="border-b border-line bg-surface">
      <div className="container flex min-h-14.5 items-center justify-between gap-4">
        <Link
          href="/"
          onClick={(event) => {
            if (pathname === "/") {
              event.preventDefault();
              window.location.reload();
            }
          }}
          className="text-h5 text-text"
          aria-label="레시비 홈"
        >
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
          {session.data?.authenticated && (
            <Link
              href="/bookmarks"
              aria-current={pathname === "/bookmarks" ? "page" : undefined}
              className={`inline-flex min-h-11 items-center font-medium hover:text-text ${pathname === "/bookmarks" ? "text-text" : "text-text-2"}`}
            >
              북마크
            </Link>
          )}
          {session.data?.authenticated ? (
            <>
              <span aria-hidden="true" className="text-line-2">|</span>
              <AccountMenu name={session.data.user.name} />
            </>
          ) : (
            <LoginDialog />
          )}
        </nav>
      </div>
    </header>
  );
};
