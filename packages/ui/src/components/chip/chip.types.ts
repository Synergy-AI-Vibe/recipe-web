import type { ComponentProps } from "react";

type SelectedChipProps = {
  variant: "selected";
  label: string;
  onRemove: () => void;
  removeLabel?: string;
  className?: string;
};

type AddableChipProps = {
  variant: "addable";
  label: string;
  onAdd: () => void;
  disabled?: boolean;
  className?: string;
};

export type ChipProps = SelectedChipProps | AddableChipProps;

export type ChipAddInputProps = Omit<
  ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "aria-label"
> & {
  label: string;
  onAdd: (value: string) => void;
};
