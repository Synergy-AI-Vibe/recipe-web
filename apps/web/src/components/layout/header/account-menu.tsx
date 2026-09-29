"use client";

import { useEffect, useRef, useState } from "react";
import type { AccountMenuProps } from "@/components/layout/header/header.types";

const ITEM =
  "flex min-h-tap w-full items-center border-b border-line px-4 text-left text-n1 font-medium last:border-b-0 hover:bg-canvas focus-visible:outline-offset-[-2px] active:bg-line";

export const AccountMenu = ({ name, onLogout, onWithdraw }: AccountMenuProps) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      if (wrapRef.current?.contains(document.activeElement)) {
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      className="relative"
      ref={wrapRef}
      onBlur={(event) => {
        if (event.relatedTarget && !wrapRef.current?.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="min-h-tap px-0.5 text-n1 font-bold text-text"
        aria-expanded={open}
        title={name}
        onClick={() => setOpen((prev) => !prev)}
      >
        {/* 한글 한 글자가 약 1em이라 6em이면 6글자 정도에서 …로 줄임, 전체 이름은 DOM에 남아 스크린 리더가 끝까지 읽음 */}
        <span className="block max-w-[6em] truncate">{name}</span>
        <span className="sr-only"> 계정 메뉴</span>
      </button>
      {open && (
        <div className="absolute top-9 right-0 z-10 min-w-37 border border-line-strong bg-surface">
          <button
            type="button"
            className={`${ITEM} text-text`}
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            로그아웃
          </button>
          <button
            type="button"
            className={`${ITEM} text-accent-strong`}
            onClick={() => {
              setOpen(false);
              onWithdraw();
            }}
          >
            회원탈퇴
          </button>
        </div>
      )}
    </div>
  );
};
