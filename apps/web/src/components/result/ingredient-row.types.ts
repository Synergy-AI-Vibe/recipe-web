import type { IngredientRow } from "@recipe-web/api";

export type IngredientRowProps = {
  ingredient: IngredientRow;
  onToggle: (id: number) => void;
  onPriceChange: (id: number, value: number) => void;
};
