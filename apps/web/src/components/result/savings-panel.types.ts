import type { Recipe, StorePrice, Totals, Warnings } from "@recipe-web/api";

export type SavingsPanelProps = {
  recipe: Recipe;
  store: StorePrice | null;
  totals: Totals;
  warnings: Warnings;
  priceBaseDate: string;
};
