import type { IngredientRow as IngredientRowData } from "@recipe-web/api";
import { cn, PriceInput, Tag } from "@recipe-web/ui";
import { formatWon } from "@/lib/calc";
import { getAmountText, getDisplayName } from "@/lib/ingredient-text";
import type { IngredientRowProps } from "@/components/result/ingredient-row.types";

const CHECK_BOX =
  "inline-flex size-5 flex-none items-center justify-center border-[1.5px] border-text-3 bg-surface text-c2 leading-none text-transparent " +
  "peer-hover:border-text peer-checked:border-text peer-checked:bg-text peer-checked:text-on-ink peer-active:border-accent " +
  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus";

const getSubText = (ingredient: IngredientRowData): string => {
  if (!ingredient.checked) return "집에 있음 · 계산에서 제외";
  if (!ingredient.hasPrice) return "공공 데이터에 없습니다 · 금액을 넣어 주세요";
  return [ingredient.packLabel, ingredient.conversionNote].filter(Boolean).join(" · ");
};

export const IngredientRow = ({ ingredient, onToggle, onPriceChange }: IngredientRowProps) => {
  const { id, checked, hasPrice } = ingredient;
  const name = getDisplayName(ingredient);
  const amount = getAmountText(ingredient);

  return (
    <li className="flex flex-wrap items-center gap-3.5 border-b border-line py-3.75">
      <span className="relative inline-flex size-11 flex-none items-center justify-center">
        <input
          id={`ingredient-${id}`}
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(id)}
          aria-label={`${name} 계산에 포함`}
          className="peer absolute inset-0 m-0 size-11 cursor-pointer opacity-0"
        />
        <label htmlFor={`ingredient-${id}`} aria-hidden className={CHECK_BOX}>
          ✓
        </label>
      </span>

      <span className="min-w-42.5 flex-1">
        <b className={cn("block text-b1b", checked ? "text-text" : "text-text-2")}>
          {name}
          {amount && <span className="font-normal text-text-2"> {amount}</span>}
        </b>
        <span className="block text-c2 text-text-2">{getSubText(ingredient)}</span>
      </span>

      <span className="flex flex-none items-center gap-2.5">
        {checked && ingredient.priceConfidence === "estimate" && <Tag>추정</Tag>}
        {checked && ingredient.needsConfirm && <Tag>확인 필요</Tag>}
        {checked && !hasPrice && <Tag tone="caution">금액 없음</Tag>}

        {!hasPrice ? (
          checked ? (
            <PriceInput
              label={`${name} 금액 직접 입력`}
              value={ingredient.userPrice ?? 0}
              onValueChange={(value) => onPriceChange(id, value)}
            />
          ) : (
            <span className="text-b2 text-text-2 line-through">0원</span>
          )
        ) : (
          <span className={cn("text-b2", checked ? "text-text" : "text-text-2 line-through")}>
            {formatWon(ingredient.unitCost ?? 0)}원
          </span>
        )}
      </span>
    </li>
  );
};
