import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBookmark,
  deleteBookmark,
  getBookmarkCount,
  getBookmarks,
  type BookmarkList,
  type CreateBookmarkRequest,
} from "@recipe-web/api";
import { getApiClient } from "@/lib/api-client";

export const bookmarkQueryKeys = {
  all: ["bookmarks"] as const,
  list: ["bookmarks", "list"] as const,
  count: ["bookmarks", "count"] as const,
};

export const useBookmarks = (enabled: boolean) =>
  useQuery({
    queryKey: bookmarkQueryKeys.list,
    queryFn: () => getBookmarks(getApiClient()),
    enabled,
    refetchOnMount: "always",
    meta: { errorMode: "local" },
  });

export const useBookmarkCount = (enabled: boolean) =>
  useQuery({
    queryKey: bookmarkQueryKeys.count,
    queryFn: () => getBookmarkCount(getApiClient()),
    enabled,
    meta: { errorMode: "local" },
  });

export const useCreateBookmark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookmarkRequest) => createBookmark(getApiClient(), input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.all }),
  });
};

export const useDeleteBookmark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBookmark(getApiClient(), id),
    meta: { errorMode: "local" },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<BookmarkList>(bookmarkQueryKeys.list, (current) => {
        if (!current) return current;
        const items = current.items.filter((item) => item.id !== id);
        return { ...current, items, count: items.length };
      });
      queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.all });
    },
  });
};
