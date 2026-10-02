import type { IngredientRow } from "@recipe-web/api";

export const getAmountText = (ingredient: IngredientRow): string | null => {
  if (ingredient.amount !== null && ingredient.amountUnit) {
    return `${ingredient.amount}${ingredient.amountUnit}`;
  }
  if (ingredient.qty !== null && ingredient.unit) return `${ingredient.qty}${ingredient.unit}`;
  return null;
};

export const getDisplayName = (ingredient: IngredientRow): string =>
  ingredient.name ?? ingredient.rawText;
