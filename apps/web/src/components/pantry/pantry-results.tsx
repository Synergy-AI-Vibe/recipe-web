import Link from "next/link";
import { Button, List, NoticeCard, Skeleton, TextLink } from "@recipe-web/ui";
import { PantryMenuRow } from "@/components/pantry/pantry-menu-row";
import type { PantryResultsProps } from "@/components/pantry/pantry-results.types";
import { getResultAnnouncement } from "@/lib/pantry";

const SKELETON_ROW_COUNT = 3;

export const PantryResults = ({ view, onRetry, onReset }: PantryResultsProps) => (
  <div>
    <p role="status" className="sr-only">
      {getResultAnnouncement(view)}
    </p>

    {view.kind === "loading" && (
      <div aria-busy className="flex flex-col gap-3">
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-16" />
        ))}
      </div>
    )}

    {view.kind === "success" && (
      <section aria-labelledby="pantry-result-title">
        <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="pantry-result-title" className="text-h5">
            만들 수 있는 레시피
          </h2>
          <span className="text-c1 text-text-2">추가 구매 금액이 적은 순 {view.menus.length}개</span>
        </div>
        <List>
          {view.menus.map((menu) => (
            <PantryMenuRow key={menu.name} menu={menu} />
          ))}
        </List>
        <p className="mt-4.5 text-c1 text-text-2">
          추가 구매 금액은 부족한 재료를 최소 구매 단위(팩)로 샀을 때의 합계입니다. 가격을 확인하지 못한
          재료는 합계에 포함되지 않습니다.
        </p>
      </section>
    )}

    {view.kind === "empty" && (
      <NoticeCard
        eyebrow="찾지 못했어요"
        title={<h2>이 재료로 만들 수 있는 레시피가 없어요</h2>}
        description={"고른 재료가 겹치는 레시피를 찾지 못했습니다.\n주재료를 하나 더 넣거나, 레시피 링크로 바로 계산해 보세요."}
        actions={
          <>
            <Button className="text-b3" onClick={onReset}>
              재료 다시 고르기
            </Button>
            <TextLink as={Link} href="/">
              링크로 계산하기
            </TextLink>
          </>
        }
      />
    )}

    {view.kind === "failed" && (
      <NoticeCard
        eyebrow="추천 실패"
        title={<h2>추천을 불러오지 못했어요</h2>}
        description="잠시 후 다시 시도해 주세요."
        actions={
          <Button variant="ghost" className="text-b3" onClick={onRetry}>
            다시 시도
          </Button>
        }
      />
    )}
  </div>
);
