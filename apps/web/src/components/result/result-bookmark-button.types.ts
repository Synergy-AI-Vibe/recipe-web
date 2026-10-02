import type { AnalyzeData } from "@recipe-web/api";
import type { ResultSource } from "@/types/result";

export type ResultBookmarkButtonProps = {
  source: ResultSource | null;
  data: AnalyzeData;
};
