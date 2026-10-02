"use client";

import { useRouter } from "next/navigation";
import { ResultBookmarkButton } from "@/components/result/result-bookmark-button";
import { ResultFailed, ResultLoading } from "@/components/result/result-status";
import { ResultView } from "@/components/result/result-view";
import { useResultEntry } from "@/hooks/use-result-entry";
import { useResultStore } from "@/store/result-store";

export const ResultPageContent = () => {
  const router = useRouter();
  const entry = useResultEntry();
  const source = useResultStore((state) => state.source);
  const adjustments = useResultStore((state) => state.adjustments);
  const toggleIngredient = useResultStore((state) => state.toggleIngredient);
  const setUserPrice = useResultStore((state) => state.setUserPrice);

  if (entry.kind === "loading") return <ResultLoading />;

  if (entry.kind === "failed") {
    return (
      <ResultFailed
        onGoHome={() => {
          useResultStore.getState().clear();
          router.push("/");
        }}
      />
    );
  }

  return (
    <ResultView
      key={entry.data.recipe.sourceUrl ?? entry.data.recipe.title}
      data={entry.data}
      adjustments={adjustments}
      onToggleIngredient={toggleIngredient}
      onPriceChange={setUserPrice}
      headerAction={<ResultBookmarkButton source={source} data={entry.data} />}
    />
  );
};
