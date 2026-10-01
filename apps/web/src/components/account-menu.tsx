"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { anonymousSession } from "@recipe-web/api";
import { showToast } from "@recipe-web/ui";
import { sessionQueryKey } from "@/hooks/use-session";
import { getSupabaseClient } from "@/lib/supabase/client";

export const withdrawOriginKey = "recipe-web:withdraw-origin";

export const AccountMenu = ({ name }: { name: string }) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error: signOutError } = await getSupabaseClient().auth.signOut();
      if (signOutError) throw signOutError;
    },
    meta: { errorMode: "local" },
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(sessionQueryKey, anonymousSession);
      setOpen(false);
      showToast("로그아웃되었습니다.");
      if (pathname === "/bookmarks" || pathname === "/account/withdraw") router.replace("/");
    },
    onError: () => setError(true),
  });

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => { setOpen((current) => !current); setError(false); }}
        className="inline-flex min-h-11 items-center font-bold text-text hover:text-accent"
      >
        {name}
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-20 w-37 border border-line-strong bg-surface text-text">
          <button
            type="button"
            role="menuitem"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            className="flex min-h-11 w-full items-center border-b border-line px-4 text-left font-medium hover:bg-canvas disabled:cursor-not-allowed disabled:text-text-3"
          >
            {logoutMutation.isPending ? "로그아웃 중…" : "로그아웃"}
          </button>
          <Link
            href="/account/withdraw"
            role="menuitem"
            onClick={() => { sessionStorage.setItem(withdrawOriginKey, pathname); setOpen(false); }}
            className="flex min-h-11 items-center px-4 font-medium text-accent hover:bg-canvas"
          >
            회원탈퇴
          </Link>
          {error && <p role="alert" className="border-t border-line px-4 py-2 text-c2 text-accent">로그아웃에 실패했습니다. 다시 시도해 주세요.</p>}
        </div>
      )}
    </div>
  );
};
