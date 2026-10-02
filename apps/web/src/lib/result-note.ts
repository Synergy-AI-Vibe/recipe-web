import type { IngredientRow } from "@recipe-web/api";
import { formatWon } from "@/lib/calc";
import { topicParticle } from "@/lib/korean";

const sumBy = (rows: IngredientRow[], pick: (row: IngredientRow) => number | null) =>
  rows.reduce((sum, row) => sum + (pick(row) ?? 0), 0);

const labelOf = (rows: IngredientRow[]) =>
  rows.length === 1 ? (rows[0].name ?? rows[0].rawText) : `재료 ${rows.length}개`;

const withTopicParticle = (word: string): string => `${word}${topicParticle(word)}`;

export const buildAdjustmentNote = (ingredients: IngredientRow[]): string | null => {
  const excluded = ingredients.filter((row) => !row.checked && row.hasPrice);
  if (excluded.length > 0) {
    return `집에 있는 재료 ${excluded.length}개 ${formatWon(sumBy(excluded, (row) => row.unitCost))}원 제외됨`;
  }

  const unpriced = ingredients.filter((row) => row.checked && !row.hasPrice);
  const entered = unpriced.filter((row) => (row.userPrice ?? 0) > 0);
  if (entered.length > 0) {
    return `${withTopicParticle(labelOf(entered))} 직접 입력한 ${formatWon(sumBy(entered, (row) => row.userPrice))}원으로 계산했습니다`;
  }

  if (unpriced.length > 0) {
    return `${withTopicParticle(labelOf(unpriced))} 금액을 넣기 전까지 합계에 없습니다`;
  }

  return null;
};
