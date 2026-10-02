import type { IngredientRow, Totals, Warnings } from "@recipe-web/api";

export type IngredientsPanelProps = {
  ingredients: IngredientRow[];
  totals: Totals;
  warnings: Warnings;
  priceBaseDate: string;
  adjustmentNote: string | null;
  onToggleIngredient: (id: number) => void;
  onPriceChange: (id: number, value: number) => void;
};
