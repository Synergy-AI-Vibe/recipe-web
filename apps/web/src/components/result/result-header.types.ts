import type { ReactNode } from "react";
import type { Recipe } from "@recipe-web/api";

export type ResultHeaderProps = {
  recipe: Recipe;
  ingredientCount: number;
  action?: ReactNode;
};
