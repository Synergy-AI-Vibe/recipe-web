import type { ComponentProps } from "react";

export type TabItem = {
  key: string;
  label: string;
  meta?: string;
};

export type TabBarProps = Omit<ComponentProps<"div">, "onChange"> & {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  label?: string;
  idPrefix?: string;
  sticky?: boolean;
};
