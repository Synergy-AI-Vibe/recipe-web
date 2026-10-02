import type { IngredientRow } from "@recipe-web/api";
import type { ResultAdjustments } from "@/types/result";

export const applyAdjustments = (
  rows: IngredientRow[],
  adjustments: ResultAdjustments,
): IngredientRow[] =>
  rows.map((row) => {
    const adjustment = adjustments[row.id];
    if (!adjustment) return row;
    return {
      ...row,
      checked: adjustment.checked ?? row.checked,
      userPrice: adjustment.userPrice !== undefined ? adjustment.userPrice : row.userPrice,
    };
  });
