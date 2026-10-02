import type { PantryView } from "@/types/pantry";

export type PantryResultsProps = {
  view: PantryView;
  onRetry: () => void;
  onReset: () => void;
};
