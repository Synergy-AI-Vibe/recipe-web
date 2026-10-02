import type { ComponentProps } from "react";

export type BookmarkButtonProps = Omit<ComponentProps<"button">, "type" | "children"> & {
  active: boolean;
  label?: string;
  activeLabel?: string;
  loading?: boolean;
  savingLabel?: string;
  removingLabel?: string;
};
