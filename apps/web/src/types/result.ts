import type { AnalyzeData } from "@recipe-web/api";

export type ResultTabKey = "savings" | "ingredients" | "steps";

export type ResultSource =
  | { type: "youtube"; url: string }
  | { type: "text"; text: string };

export type IngredientAdjustment = {
  checked?: boolean;
  userPrice?: number | null;
};

export type ResultAdjustments = Record<number, IngredientAdjustment>;

export type ResultEntry =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "ready"; data: AnalyzeData };

export type ResultState = {
  source: ResultSource | null;
  data: AnalyzeData | null;
  adjustments: ResultAdjustments;
};

export type ResultActions = {
  open: (source: ResultSource, data: AnalyzeData) => void;
  toggleIngredient: (id: number) => void;
  setUserPrice: (id: number, value: number) => void;
  clear: () => void;
};

export type ResultStore = ResultState & ResultActions;
