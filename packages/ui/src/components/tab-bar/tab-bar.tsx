"use client";

import type { KeyboardEvent } from "react";
import { cn } from "../../lib/merge-class-names";
import type { TabBarProps } from "./tab-bar.types";

const getTabId = (idPrefix: string, key: string) => `${idPrefix}-tab-${key}`;
const getPanelId = (idPrefix: string, key: string) => `${idPrefix}-panel-${key}`;

export const getTabPanelProps = (idPrefix: string, key: string) => ({
  role: "tabpanel" as const,
  id: getPanelId(idPrefix, key),
  "aria-labelledby": getTabId(idPrefix, key),
  tabIndex: 0,
});

export const TabBar = ({
  tabs,
  activeKey,
  onChange,
  label,
  idPrefix = "tab",
  sticky = true,
  className,
  ...props
}: TabBarProps) => {
  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.key === activeKey),
    0,
  );

  const moveTo = (event: KeyboardEvent<HTMLButtonElement>, nextIndex: number) => {
    event.preventDefault();
    const next = tabs[nextIndex];
    onChange(next.key);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[nextIndex]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    if (event.key === "ArrowRight") moveTo(event, index === last ? 0 : index + 1);
    else if (event.key === "ArrowLeft") moveTo(event, index === 0 ? last : index - 1);
    else if (event.key === "Home") moveTo(event, 0);
    else if (event.key === "End") moveTo(event, last);
  };

  return (
    <div
      className={cn("border-b border-line bg-surface", sticky && "sticky top-0 z-4", className)}
      {...props}
    >
      <div role="tablist" aria-label={label} className="container flex flex-wrap gap-7">
        {tabs.map((tab, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={getTabId(idPrefix, tab.key)}
              aria-selected={active}
              aria-controls={getPanelId(idPrefix, tab.key)}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "-mb-px flex min-h-tap items-baseline gap-1.75 border-b-2 py-3.75 active:border-b-accent",
                active
                  ? "border-b-text text-text"
                  : "border-b-transparent text-text-3 hover:text-text",
              )}
            >
              <span className="text-s1">{tab.label}</span>
              {tab.meta && (
                <span className={cn("text-c1", active ? "text-text-2" : "text-text-4")}>{tab.meta}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
