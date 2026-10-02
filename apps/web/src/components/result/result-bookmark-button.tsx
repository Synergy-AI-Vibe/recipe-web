"use client";

import { BookmarkButton } from "@recipe-web/ui";
import { useResultBookmark } from "@/hooks/use-result-bookmark";
import type { ResultBookmarkButtonProps } from "@/components/result/result-bookmark-button.types";

export const ResultBookmarkButton = ({ source, data }: ResultBookmarkButtonProps) => {
  const bookmark = useResultBookmark(source, data);
  return (
    <BookmarkButton
      active={bookmark.active}
      loading={bookmark.loading}
      disabled={bookmark.disabled}
      onClick={bookmark.onClick}
    />
  );
};
