"use client";

import { useState } from "react";
import { PantryResults } from "@/components/pantry/pantry-results";
import { samplePantryMenus } from "@/lib/fixtures/pantry-data";
import type { PantryView } from "@/types/pantry";

const VIEWS: { key: string; label: string; view: PantryView }[] = [
  { key: "success", label: "결과 있음", view: { kind: "success", menus: samplePantryMenus } },
  { key: "loading", label: "찾는 중", view: { kind: "loading" } },
  { key: "empty", label: "추천 없음", view: { kind: "empty" } },
  { key: "failed", label: "실패", view: { kind: "failed" } },
];

export const PantryPreview = () => {
  const [viewKey, setViewKey] = useState(VIEWS[0].key);
  const current = VIEWS.find((item) => item.key === viewKey) ?? VIEWS[0];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <span className="text-c1 text-text-2">상태</span>
        {VIEWS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={item.key === viewKey}
            onClick={() => setViewKey(item.key)}
            className={`min-h-tap px-3 text-c1 ${item.key === viewKey ? "font-bold text-text" : "text-text-2"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="pt-8">
        <PantryResults view={current.view} onRetry={() => undefined} onReset={() => undefined} />
      </div>
    </>
  );
};
