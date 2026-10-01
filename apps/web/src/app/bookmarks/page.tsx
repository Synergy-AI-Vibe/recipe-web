"use client";

import { useState } from "react";
import { Banner, List, ListRow } from "@recipe-web/ui";
import { useSession } from "@/queries/auth";
import { useBookmarks, useDeleteBookmark } from "@/queries/bookmarks";

export default function BookmarksPage() {
  const session = useSession();
  const [failedId, setFailedId] = useState<number | null>(null);
  const bookmarks = useBookmarks(session.data?.authenticated === true);
  const removal = useDeleteBookmark();

  const list = bookmarks.data;
  const count = list?.items.length ?? 0;
  const limit = list?.limit ?? 5;

  return (
    <main className="container w-full flex-1 pb-section-end pt-section-page">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-h3 text-text">북마크</h1>
        {list && (
          <span className={`text-b1 ${count >= limit ? "text-accent" : "text-text-2"}`}>
            {count} / {limit}개
          </span>
        )}
      </div>
      <p className="mt-3 text-b1 text-text-2">
        저장한 레시피는 열 때마다 그날 가격으로 다시 계산됩니다.<br />
        {limit}개까지 저장할 수 있습니다.
      </p>

      {session.isPending && <p className="mt-10 text-b1 text-text-2">계정을 확인하는 중입니다.</p>}
      {session.isError && <p role="alert" className="mt-10 text-b1 text-accent">계정 정보를 불러오지 못했습니다.</p>}
      {session.data && !session.data.authenticated && <p className="mt-10 text-b1 text-text-2">북마크를 보려면 로그인이 필요합니다.</p>}

      {session.data?.authenticated && (
        <>
          {bookmarks.isPending && <p className="mt-10 text-b1 text-text-2">북마크를 불러오는 중입니다.</p>}
          {bookmarks.isError && <p role="alert" className="mt-10 text-b1 text-accent">북마크를 불러오지 못했습니다.</p>}
          {list && (
            <>
              {count >= limit && (
                <Banner className="mt-7">
                  북마크가 {limit}개로 가득 찼습니다. 새로 저장하려면 아래에서 먼저 지워 주세요.
                </Banner>
              )}
              <List className="mt-7">
                {count === 0 ? (
                  <li className="flex min-h-36 flex-col items-center justify-center gap-2 text-center">
                    <strong className="text-s2 text-text">저장한 레시피가 없습니다</strong>
                    <span className="text-b3 text-text-2">계산 결과에서 북마크를 누르면 여기에 쌓입니다.</span>
                  </li>
                ) : (
                  list.items.map((item) => (
                    <ListRow
                      key={item.id}
                      title={item.title}
                      meta={`${item.sourceType === "youtube" ? "유튜브" : "직접 입력"} · ${item.servings}인분`}
                      onRemove={() => {
                        if (removal.isPending) return;
                        setFailedId(null);
                        removal.mutate(item.id, {
                          onSuccess: () => setFailedId(null),
                          onError: () => setFailedId(item.id),
                        });
                      }}
                      removeLabel={`${item.title} 북마크 삭제`}
                    >
                      {failedId === item.id && (
                        <p role="alert" className="w-full text-c2 text-accent">삭제하지 못했습니다. 다시 시도해 주세요.</p>
                      )}
                    </ListRow>
                  ))
                )}
              </List>
            </>
          )}
        </>
      )}
    </main>
  );
}
