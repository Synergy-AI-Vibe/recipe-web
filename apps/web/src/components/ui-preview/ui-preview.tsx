"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  Banner,
  Button,
  List,
  ListRow,
  NoticeCard,
  showToast,
  Skeleton,
  Tag,
  TextLink,
  ToastViewport,
} from "@recipe-web/ui";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-t border-line-strong pt-5">
    <h2 className="mb-5 text-h5">{title}</h2>
    <div className="flex flex-col gap-5">{children}</div>
  </section>
);

const Label = ({ children }: { children: ReactNode }) => (
  <p className="mb-2 text-l1 text-text-3">{children}</p>
);

const Price = ({ amount, sub }: { amount: string; sub: string }) => (
  <>
    <b className="block text-b2 leading-[1.3]">{amount}</b>
    <span className="block text-c2 text-text-2">{sub}</span>
  </>
);

const initialBookmarks = [
  {
    id: 1,
    title: "돼지고기 김치찌개",
    meta: "유튜브 · 자취요리연구소 · 2인분",
    amount: "12,850원",
    sub: "1인분 6,425원",
  },
  {
    id: 2,
    title: "간장 계란밥",
    meta: "유튜브 · 혼밥연구소 · 1인분",
    amount: "800원",
    sub: "1인분 800원",
  },
];

const toastMessages = [
  "카카오 계정으로 로그인했습니다.",
  "로그아웃되었습니다.",
  "탈퇴가 완료되었습니다.",
];

export const UiPreview = () => {
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [opened, setOpened] = useState<string>();

  return (
    <main className="container flex flex-col gap-12 pt-section-page pb-section-end">
      <header>
        <h1 className="text-h3">공용 컴포넌트 미리보기</h1>
        <p className="mt-2 text-b4 text-text-2">
          @recipe-web/ui 확인용 임시 페이지입니다. 호버·눌림·Tab 초점을 직접 확인해 보세요.
        </p>
      </header>

      <Section title="Button">
        <div>
          <Label>variant</Label>
          <div className="flex flex-wrap gap-2.5">
            <Button>이 레시피로 계산</Button>
            <Button variant="accent">원가 계산</Button>
            <Button variant="ghost">다른 링크 넣기</Button>
            <Button variant="ghost" className="text-text">
              취소
            </Button>
          </div>
        </div>
        <div className="max-w-auth-form">
          <Label>kakao</Label>
          <Button variant="kakao">카카오로 3초 만에 시작하기</Button>
        </div>
        <div>
          <Label>disabled</Label>
          <div className="flex flex-wrap gap-2.5">
            <Button disabled>이 레시피로 계산</Button>
            <Button variant="accent" disabled>
              원가 계산
            </Button>
            <Button variant="ghost" disabled>
              다른 링크 넣기
            </Button>
          </div>
        </div>
        <div>
          <Label>loading — 라벨만 바뀌고 폭은 그대로</Label>
          <div className="flex flex-wrap gap-2.5">
            <Button loading={loading}>이 레시피로 계산</Button>
            <Button variant="accent" loading={loading}>
              원가 계산
            </Button>
            <Button variant="ghost" onClick={() => setLoading((prev) => !prev)}>
              로딩 {loading ? "끄기" : "켜기"}
            </Button>
          </div>
        </div>
      </Section>

      <Section title="TextLink">
        <div className="flex gap-6">
          <TextLink as={Link} href="/">
            ← 돌아가기
          </TextLink>
          <TextLink as="button" type="button">
            링크로 계산하기
          </TextLink>
        </div>
      </Section>

      <Section title="Tag">
        <div className="flex flex-wrap gap-1.5">
          <Tag>참가격</Tag>
          <Tag>KAMIS</Tag>
          <Tag>오픈마켓</Tag>
          <Tag tone="caution">금액 없음</Tag>
          <Tag tone="caution">직접 입력</Tag>
          <Tag tone="inverse">지금 바로 가능</Tag>
          <Tag className="py-0.75">부족 2개</Tag>
        </div>
      </Section>

      <Section title="Banner">
        <Banner>
          <b>사골육수 팩</b>은 가격 데이터가 없습니다. 아래에서 금액을 넣으면 합계에 바로
          반영됩니다.
        </Banner>
        <Banner>북마크가 5개로 가득 찼습니다. 새로 저장하려면 아래에서 먼저 지워 주세요.</Banner>
      </Section>

      <Section title="ListRow">
        <div>
          <Label>북마크 — 행을 누르면 열리고, ×는 그 행만 지웁니다</Label>
          <List>
            {bookmarks.map((item) => (
              <ListRow
                key={item.id}
                title={item.title}
                meta={item.meta}
                trailing={<Price amount={item.amount} sub={item.sub} />}
                onOpen={() => setOpened(item.title)}
                onRemove={() =>
                  setBookmarks((prev) => prev.filter(({ id }) => id !== item.id))
                }
                removeLabel={`${item.title} 삭제`}
              />
            ))}
          </List>
          <p className="mt-3 text-c1 text-text-2">
            열린 행: {opened ?? "없음"}
            {bookmarks.length < initialBookmarks.length && (
              <button
                type="button"
                className="ml-3 underline"
                onClick={() => setBookmarks(initialBookmarks)}
              >
                되돌리기
              </button>
            )}
          </p>
        </div>
        <div>
          <Label>추천 결과 — 링크로 열림</Label>
          <List>
            <ListRow
              title={
                <>
                  김치볶음밥 <Tag tone="inverse">지금 바로 가능</Tag>
                </>
              }
              meta="가진 재료 5개로 전부 됩니다"
              trailing={<Price amount="추가 0원" sub="7,053원 절약" />}
              trailingWidth={104}
              href="/ui-preview"
              linkAs={Link}
            />
            <ListRow
              title={
                <>
                  계란말이 <Tag className="py-0.75">부족 1개</Tag>
                </>
              }
              meta="사야 할 재료 당근"
              trailing={<Price amount="추가 460원" sub="5,890원 절약" />}
              trailingWidth={104}
              href="/ui-preview"
              linkAs={Link}
            />
          </List>
        </div>
      </Section>

      <Section title="NoticeCard">
        <NoticeCard
          eyebrow="추출 실패"
          title="설명란에서 재료를 찾지 못했어요"
          description="이 영상은 설명란에 재료 목록이 없습니다. 재료를 직접 적어 주시면 같은 방식으로 계산해 드립니다."
          actions={
            <>
              <Button className="text-[13.5px]">이 레시피로 계산</Button>
              <Button variant="ghost" className="text-[13.5px]">
                다른 링크 넣기
              </Button>
            </>
          }
        />
        <NoticeCard variant="quiet">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-b1b">김치찌개 2인</span>
            <span className="text-b2">18,000 ~ 24,000원</span>
          </div>
        </NoticeCard>
      </Section>

      <Section title="Skeleton">
        <ul aria-busy className="border-t border-line-strong">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index} className="flex items-center gap-4 border-b border-line py-4">
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="h-4 w-24" />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Toast">
        <Label>2.6초 뒤 사라집니다. 연달아 눌러도 쌓이지 않습니다</Label>
        <div className="flex flex-wrap gap-2.5">
          {toastMessages.map((message) => (
            <Button key={message} variant="ghost" onClick={() => showToast(message)}>
              {message}
            </Button>
          ))}
        </div>
      </Section>

      <ToastViewport />
    </main>
  );
};
