import type { ComponentProps } from "react";

export type PriceInputProps = Omit<ComponentProps<"input">, "type" | "value" | "onChange" | "aria-label"> & {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  unit?: string;
};
