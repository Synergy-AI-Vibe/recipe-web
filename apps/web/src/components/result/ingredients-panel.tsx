import { Banner, List } from "@recipe-web/ui";
import { PRICE_SOURCES } from "@/constants/result";
import { formatWon } from "@/lib/calc";
import { formatMonthDay } from "@/lib/format-date";
import { topicParticle } from "@/lib/korean";
import { IngredientRow } from "@/components/result/ingredient-row";
import type { IngredientsPanelProps } from "@/components/result/ingredients-panel.types";

export const IngredientsPanel = ({
  ingredients,
  totals,
  warnings,
  priceBaseDate,
  adjustmentNote,
  onToggleIngredient,
  onPriceChange,
}: IngredientsPanelProps) => {
  const missingNames = warnings.missingMain.join(", ");

  return (
    <>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-h5">재료별 금액</h2>
        <span className="text-c1 text-text-2">{formatMonthDay(priceBaseDate)} 갱신</span>
      </div>
      <p className="mb-5.5 max-w-[56ch] text-b4 text-text-2">
        이미 집에 있는 재료는 체크를 풀면 해 먹는 금액에서 빠집니다.
      </p>

      {warnings.missingMain.length > 0 && (
        <Banner className="mb-5.5">
          <b>{missingNames}</b>
          {topicParticle(missingNames)} 가격 데이터가 없습니다. 아래에서 금액을 넣으면 합계에 바로 반영됩니다.
        </Banner>
      )}

      <List>
        {ingredients.map((ingredient) => (
          <IngredientRow
            key={ingredient.id}
            ingredient={ingredient}
            onToggle={onToggleIngredient}
            onPriceChange={onPriceChange}
          />
        ))}
        <li
          aria-live="polite"
          aria-atomic="true"
          className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-line-strong py-5"
        >
          <span>
            <b className="block text-h5">재료비 합계</b>
            {adjustmentNote && <span className="block text-c1 text-text-2">{adjustmentNote}</span>}
          </span>
          <span className="text-h6">{formatWon(totals.ingredientTotal)}원</span>
        </li>
      </List>

      {warnings.estimatedCount > 0 && (
        <p className="mt-3 text-b4 text-text-2">
          가격이 붙은 재료 {warnings.pricedCount}개 중 {warnings.estimatedCount}개는 추정 가격입니다.
        </p>
      )}

      <p className="mt-5.5 text-b3 text-text-2">
        실제로 구매하려면 장바구니 기준 최소{" "}
        <b className="font-bold text-text">{formatWon(totals.basketTotal)}원</b>이 필요합니다. 구매 단위
        전체 가격의 합이며, 실제 결제 기능은 없습니다.
      </p>

      <ul className="mt-6 flex flex-wrap gap-5 border-t border-line pt-4.5">
        {PRICE_SOURCES.map((source) => (
          <li key={source.name} className="min-w-42.5">
            <b className="block text-c1 font-bold">{source.name}</b>
            <span className="block text-c2 text-text-2">{source.description}</span>
          </li>
        ))}
      </ul>
    </>
  );
};
