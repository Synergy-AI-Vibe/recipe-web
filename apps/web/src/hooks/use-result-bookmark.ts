import { useRouter } from "next/navigation";
import type { AnalyzeData } from "@recipe-web/api";
import { buildBookmarkInput, findSavedBookmark, getCreateOutcome } from "@/lib/bookmark-input";
import { useSession } from "@/queries/auth";
import { useBookmarks, useCreateBookmark, useDeleteBookmark } from "@/queries/bookmarks";
import { useLoginDialogStore } from "@/store/login-dialog-store";
import type { ResultSource } from "@/types/result";

export const useResultBookmark = (source: ResultSource | null, data: AnalyzeData) => {
  const router = useRouter();
  const session = useSession();
  const authenticated = session.data?.authenticated === true;
  const bookmarks = useBookmarks(authenticated);
  const create = useCreateBookmark();
  const remove = useDeleteBookmark();
  const requestLogin = useLoginDialogStore((state) => state.requestOpen);

  const saved = findSavedBookmark(bookmarks.data?.items ?? [], source);

  const onClick = () => {
    if (!source) return;
    if (!authenticated) {
      requestLogin();
      return;
    }
    if (saved) {
      remove.mutate(saved.id);
      return;
    }
    create.mutate(buildBookmarkInput(source, data), {
      onSuccess: (response) => {
        const outcome = getCreateOutcome(response);
        if (outcome === "login") requestLogin();
        if (outcome === "limit") router.push("/bookmarks");
      },
    });
  };

  return {
    active: saved !== null,
    loading: create.isPending || remove.isPending,
    disabled: source === null || session.isPending || (authenticated && bookmarks.isPending),
    onClick,
  };
};
