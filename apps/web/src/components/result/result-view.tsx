"use client";

import { useMemo, useState } from "react";
import { getTabPanelProps, TabBar, type TabItem } from "@recipe-web/ui";
import { applyAdjustments } from "@/lib/adjust-ingredients";
import { computeTotals, computeWarnings, formatWon } from "@/lib/calc";
import { buildAdjustmentNote } from "@/lib/result-note";
import { IngredientsPanel } from "@/components/result/ingredients-panel";
import { ResultHeader } from "@/components/result/result-header";
import { SavingsPanel } from "@/components/result/savings-panel";
import { StepsPanel } from "@/components/result/steps-panel";
import type { ResultViewProps } from "@/components/result/result-view.types";
import type { ResultTabKey } from "@/types/result";

const ID_PREFIX = "result";
const PANEL = "container pt-section-tab pb-section-end";

export const ResultView = ({
  data,
  adjustments,
  onToggleIngredient,
  onPriceChange,
  headerAction,
}: ResultViewProps) => {
  const [activeTab, setActiveTab] = useState<ResultTabKey>("savings");
  const { recipe, store, priceBaseDate } = data;

  const ingredients = useMemo(
    () => applyAdjustments(data.ingredients, adjustments),
    [data.ingredients, adjustments],
  );
  const totals = useMemo(
    () => computeTotals(ingredients, store, recipe.servings),
    [ingredients, store, recipe.servings],
  );
  const warnings = useMemo(() => computeWarnings(ingredients), [ingredients]);
  const adjustmentNote = useMemo(() => buildAdjustmentNote(ingredients), [ingredients]);

  const tabs: TabItem[] = [
    { key: "savings", label: "절약 금액", meta: store ? `${formatWon(totals.savings)}원` : undefined },
    { key: "ingredients", label: "재료별 금액", meta: `${ingredients.length}개` },
    {
      key: "steps",
      label: "조리법",
      meta: recipe.steps.length > 0 ? `${recipe.steps.length}단계` : undefined,
    },
  ];

  return (
    <>
      <ResultHeader recipe={recipe} ingredientCount={ingredients.length} action={headerAction} />
      <TabBar
        idPrefix={ID_PREFIX}
        label="결과 보기"
        tabs={tabs}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as ResultTabKey)}
      />
      <section className={PANEL} {...getTabPanelProps(ID_PREFIX, activeTab)}>
        {activeTab === "savings" && (
          <SavingsPanel
            recipe={recipe}
            store={store}
            totals={totals}
            warnings={warnings}
            priceBaseDate={priceBaseDate}
          />
        )}
        {activeTab === "ingredients" && (
          <IngredientsPanel
            ingredients={ingredients}
            totals={totals}
            warnings={warnings}
            priceBaseDate={priceBaseDate}
            adjustmentNote={adjustmentNote}
            onToggleIngredient={onToggleIngredient}
            onPriceChange={onPriceChange}
          />
        )}
        {activeTab === "steps" && <StepsPanel recipe={recipe} ingredients={ingredients} />}
      </section>
    </>
  );
};
