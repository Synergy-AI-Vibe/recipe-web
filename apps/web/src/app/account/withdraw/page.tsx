"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { anonymousSession, deleteAccount, getBookmarkCount } from "@recipe-web/api";
import { showToast } from "@recipe-web/ui";
import { withdrawOriginKey } from "@/components/account-menu";
import { useSession, sessionQueryKey } from "@/hooks/use-session";
import { getApiClient } from "@/lib/api-client";
import { getSupabaseClient } from "@/lib/supabase/client";

const getOrigin = () => {
  const origin = sessionStorage.getItem(withdrawOriginKey);
  return origin && origin.startsWith("/") && !origin.startsWith("//") && origin !== "/account/withdraw"
    ? origin
    : "/";
};

export default function WithdrawPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const count = useQuery({
    queryKey: ["bookmarks", "count"],
    queryFn: () => getBookmarkCount(getApiClient()),
    enabled: session.data?.authenticated === true,
    meta: { errorMode: "local" },
  });
  const withdrawal = useMutation({
    mutationFn: async () => {
      await deleteAccount(getApiClient());
      await getSupabaseClient().auth.signOut({ scope: "local" }).catch(() => undefined);
    },
    meta: { errorMode: "local" },
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(sessionQueryKey, anonymousSession);
      sessionStorage.removeItem(withdrawOriginKey);
      showToast("탈퇴가 완료되었습니다.");
      router.replace("/");
    },
  });

  const goBack = () => {
    const origin = getOrigin();
    sessionStorage.removeItem(withdrawOriginKey);
    router.push(origin);
  };

  return (
    <main className="container min-h-[60vh] py-section-auth">
      <div className="mx-auto max-w-auth-text">
        <button type="button" onClick={goBack} className="mb-8 min-h-11 text-b1b text-text-2 hover:text-text">← 돌아가기</button>
        <h1 className="text-h3 text-text">정말 탈퇴하시겠어요?</h1>
        {session.isPending && <p className="mt-4 text-b1 text-text-2">계정을 확인하는 중입니다.</p>}
        {session.isError && <p role="alert" className="mt-4 text-b1 text-accent">계정 정보를 불러오지 못했습니다.</p>}
        {session.data && !session.data.authenticated && <p className="mt-4 text-b1 text-text-2">로그인이 필요합니다.</p>}
        {session.data?.authenticated && (
          <>
            {count.isPending && <p className="mt-4 text-b1 text-text-2">북마크 개수를 확인하는 중입니다.</p>}
            {count.isError && <p role="alert" className="mt-4 text-b1 text-accent">북마크 개수를 불러오지 못했습니다.</p>}
            {count.isSuccess && (
              <>
                <p className="mt-4 text-b1 text-text-2">저장한 북마크 {count.data}개가 모두 삭제되고 되돌릴 수 없습니다.</p>
                <div className="mt-10 flex gap-3">
                  <button
                    type="button"
                    disabled={withdrawal.isPending}
                    onClick={() => withdrawal.mutate()}
                    className="min-h-12 bg-accent px-7 text-b1b text-on-ink hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-disabled"
                  >
                    {withdrawal.isPending ? "탈퇴 처리 중…" : "탈퇴하기"}
                  </button>
                  <button type="button" disabled={withdrawal.isPending} onClick={goBack} className="min-h-12 border border-line px-7 text-b1b text-text hover:bg-canvas disabled:cursor-not-allowed disabled:text-text-3">취소</button>
                </div>
                {withdrawal.isError && <p role="alert" className="mt-4 text-b1 text-accent">탈퇴에 실패했습니다. 다시 시도해 주세요.</p>}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
