import type { IngredientRow, StorePrice, Totals, Warnings } from "@recipe-web/api";

const toNumber = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

export const rowIngredientCost = (row: IngredientRow): number => {
  if (!row.checked) return 0;
  return row.hasPrice ? toNumber(row.unitCost) : toNumber(row.userPrice);
};

export const rowBasketCost = (row: IngredientRow): number => {
  if (!row.checked) return 0;
  return row.hasPrice ? toNumber(row.packCost) : toNumber(row.userPrice);
};

export const computeTotals = (
  rows: IngredientRow[],
  store: StorePrice | null,
  servings: number,
): Totals => {
  const ingredientTotal = rows.reduce((sum, row) => sum + rowIngredientCost(row), 0);
  const basketTotal = rows.reduce((sum, row) => sum + rowBasketCost(row), 0);

  const safeServings = servings > 0 ? servings : 1;
  const perServing = Math.round(ingredientTotal / safeServings);

  const storeAverage = store ? toNumber(store.avg) : 0;
  const savings = storeAverage > 0 ? Math.max(storeAverage - ingredientTotal, 0) : 0;
  const savingsPercent = storeAverage > 0 ? roundToOneDecimal((savings / storeAverage) * 100) : 0;
  const barPercent =
    storeAverage > 0 ? roundToOneDecimal(Math.min((ingredientTotal / storeAverage) * 100, 100)) : 0;

  return { ingredientTotal, basketTotal, perServing, savings, savingsPercent, barPercent };
};

export const computeWarnings = (rows: IngredientRow[]): Warnings => {
  const missingMain: string[] = [];
  const missingSeasoning: string[] = [];
  let estimatedCount = 0;
  let pricedCount = 0;

  for (const row of rows) {
    if (!row.checked) continue;

    if (!row.hasPrice && !(toNumber(row.userPrice) > 0)) {
      const label = row.name ?? row.rawText;
      if (row.role === "main") missingMain.push(label);
      else missingSeasoning.push(label);
      continue;
    }

    pricedCount += 1;
    if (row.priceConfidence === "estimate") estimatedCount += 1;
  }

  return { missingMain, missingSeasoning, estimatedCount, pricedCount };
};

export const formatWon = (value: number): string => Math.round(value).toLocaleString("ko-KR");

export const formatPercent = (value: number): string => value.toFixed(1);
