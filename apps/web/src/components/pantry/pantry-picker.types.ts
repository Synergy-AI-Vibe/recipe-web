import type { FormEvent } from "react";
import type { PantryHint } from "@/types/pantry";

export type PantryPickerProps = {
  chosen: string[];
  isFull: boolean;
  hint: PantryHint;
  popular: string[];
  pending: boolean;
  onAdd: (label: string) => void;
  onRemove: (label: string) => void;
  onClear: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};
