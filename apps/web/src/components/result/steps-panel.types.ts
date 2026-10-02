import type { IngredientRow, Recipe } from "@recipe-web/api";

export type StepsPanelProps = {
  recipe: Recipe;
  ingredients: IngredientRow[];
};
