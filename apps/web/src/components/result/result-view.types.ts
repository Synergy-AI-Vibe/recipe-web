import type { ReactNode } from "react";
import type { AnalyzeData } from "@recipe-web/api";
import type { ResultAdjustments } from "@/types/result";

export type ResultViewProps = {
  data: AnalyzeData;
  adjustments: ResultAdjustments;
  onToggleIngredient: (id: number) => void;
  onPriceChange: (id: number, value: number) => void;
  headerAction?: ReactNode;
};
