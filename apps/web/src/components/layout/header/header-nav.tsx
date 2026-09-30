"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@recipe-web/ui";
import { AccountMenu } from "@/components/layout/header/account-menu";
import type { HeaderProps, NavLink } from "@/components/layout/header/header.types";

const NAV_LINKS: NavLink[] = [
  { href: "/pantry", label: "있는 재료로 찾기" },
  { href: "/bookmarks", label: "북마크", requiresAuth: true },
];

export const HeaderNav = ({ user }: HeaderProps) => {
  const pathname = usePathname();

  const handleLogin = () => {console.log("로그잉")};
  const handleLogout = () => {console.log("로그아우또")};
  const handleWithdraw = () => {console.log("회원탈퉤")};

  const links = NAV_LINKS.filter((link) => !link.requiresAuth || user);

  return (
    <nav aria-label="주요 메뉴">
      <ul className="flex flex-wrap items-center gap-4.5">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <li
              key={link.href}
              className="relative flex items-center not-last:after:absolute not-last:after:top-1/2 not-last:after:-right-2.25 not-last:after:h-3.5 not-last:after:w-px not-last:after:-translate-y-1/2 not-last:after:bg-line-2"
            >
              <Link
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative grid justify-items-center text-n1 before:absolute before:-inset-x-1.5 before:-inset-y-4 before:content-[''] hover:text-text active:text-accent",
                  isActive ? "text-text" : "text-text-2",
                )}
              >
                {/* 굵은 글씨 폭을 미리 잡아 두어, 현재 메뉴가 바뀌어 굵기가 달라져도 메뉴가 밀리지 않게 합니다 */}
                <span
                  className={cn(
                    "[grid-area:1/1]",
                    isActive ? "font-bold" : "font-medium",
                  )}
                >
                  {link.label}
                </span>
                <span
                  className="invisible font-bold [grid-area:1/1]"
                  aria-hidden="true"
                >
                  {link.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="flex items-center">
          {user ? (
            <AccountMenu
              name={user.name}
              onLogout={handleLogout}
              onWithdraw={handleWithdraw}
            />
          ) : (
            <button
              type="button"
              className="relative text-n1 font-bold text-text before:absolute before:-inset-x-1.5 before:-inset-y-4 before:content-[''] active:text-accent"
              onClick={handleLogin}
            >
              로그인
            </button>
          )}
        </li>
      </ul>
    </nav>
  );
};
