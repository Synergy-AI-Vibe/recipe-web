"use client";

import { useState } from "react";
import type { AnalyzeData } from "@recipe-web/api";
import { BookmarkButton } from "@recipe-web/ui";
import {
  sampleAnalyzeData,
  sampleMissingMainData,
  sampleNoStoreData,
} from "@/lib/fixtures/analyze-data";
import { ResultView } from "@/components/result/result-view";
import type { ResultAdjustments } from "@/types/result";

const SAMPLES: { key: string; label: string; data: AnalyzeData }[] = [
  { key: "normal", label: "정상", data: sampleAnalyzeData },
  { key: "no-store", label: "사 먹는 가격 없음", data: sampleNoStoreData },
  { key: "missing-main", label: "주재료 가격 없음", data: sampleMissingMainData },
];

export const ResultPreview = () => {
  const [sampleKey, setSampleKey] = useState(SAMPLES[0].key);
  const [adjustments, setAdjustments] = useState<ResultAdjustments>({});
  const sample = SAMPLES.find((item) => item.key === sampleKey) ?? SAMPLES[0];

  return (
    <>
      <div className="container flex flex-wrap items-center gap-2 border-b border-line py-3">
        <span className="text-c1 text-text-2">샘플</span>
        {SAMPLES.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={item.key === sampleKey}
            onClick={() => {
              setSampleKey(item.key);
              setAdjustments({});
            }}
            className={`min-h-tap px-3 text-c1 ${item.key === sampleKey ? "font-bold text-text" : "text-text-3"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <ResultView
        key={sample.key}
        data={sample.data}
        adjustments={adjustments}
        onToggleIngredient={(id) =>
          setAdjustments((current) => {
            const row = sample.data.ingredients.find((ingredient) => ingredient.id === id);
            const checked = current[id]?.checked ?? row?.checked ?? true;
            return { ...current, [id]: { ...current[id], checked: !checked } };
          })
        }
        onPriceChange={(id, value) =>
          setAdjustments((current) => ({ ...current, [id]: { ...current[id], userPrice: value } }))
        }
        headerAction={<BookmarkButton active={false} />}
      />
    </>
  );
};
