import { Banner, NoticeCard } from "@recipe-web/ui";
import { formatPercent, formatWon } from "@/lib/calc";
import { formatMonthDay } from "@/lib/format-date";
import { CompareBar } from "@/components/result/compare-bar";
import type { SavingsPanelProps } from "@/components/result/savings-panel.types";

export const SavingsPanel = ({ recipe, store, totals, warnings, priceBaseDate }: SavingsPanelProps) => (
  <>
    {warnings.missingMain.length > 0 && (
      <Banner className="mb-7">
        <b>가격을 찾지 못한 주재료가 있어요.</b> {warnings.missingMain.join(", ")} — 합계가 실제보다 낮을 수
        있습니다.
      </Banner>
    )}

    {store ? (
      <>
        <p className="mb-4 text-l1-strong text-text-2">직접 만들면</p>
        <p className="mb-3.5 flex flex-wrap items-baseline gap-1.5">
          <span className="text-d1 text-accent">{totals.savings.toLocaleString("ko-KR")}</span>
          <span className="text-d2 text-accent">원</span>
          <span className="ml-1.5 text-d3">아낍니다</span>
        </p>
        <p className="mb-7.5 text-b1 text-text-2">
          사 먹으면 {formatWon(store.avg)}원, 직접 만들면 {formatWon(totals.ingredientTotal)}원. 한 끼에{" "}
          {formatPercent(totals.savingsPercent)}%.
        </p>

        <CompareBar
          eatOutAverage={store.avg}
          ingredientTotal={totals.ingredientTotal}
          fillPercent={totals.barPercent}
        />
        <p className="flex flex-wrap items-baseline justify-between gap-4 py-4 text-b4 text-text-2">
          <span>1인분으로 나누면</span>
          <span>
            {formatWon(store.avg / recipe.servings)}원 →{" "}
            <b className="font-bold text-text">{formatWon(totals.perServing)}원</b>
          </span>
        </p>

        <h2 className="mt-8.5 mb-3.5 text-s1">사 먹으면 기준이 된 가격</h2>
        <NoticeCard variant="quiet" className="flex flex-wrap items-baseline justify-between gap-3.5">
          <span className="text-s2">
            {store.menuName} {recipe.servings}인
          </span>
          <span className="text-s2">
            {formatWon(store.min)} ~ {formatWon(store.max)}원
          </span>
        </NoticeCard>
        <p className="mt-3 text-c1 text-text-2">
          {formatMonthDay(priceBaseDate)} 기준 · 이 범위의 평균값 {formatWon(store.avg)}원을 비교 기준으로
          씁니다. 배달비 {formatWon(store.deliveryFee)}원 포함.
        </p>
      </>
    ) : (
      <div className="text-b1 text-text-2">
        <p>이 레시피는 비교할 매장가 정보가 없습니다.</p>
        <p className="mt-2">
          재료비 합계는 <b className="font-bold text-text">{formatWon(totals.ingredientTotal)}원</b>, 1인분
          기준 <b className="font-bold text-text">{formatWon(totals.perServing)}원</b>입니다.
        </p>
      </div>
    )}
  </>
);
