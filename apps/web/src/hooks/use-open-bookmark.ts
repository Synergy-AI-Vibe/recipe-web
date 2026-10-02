import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Bookmark } from "@recipe-web/api";
import { useAnalyzeRecipe } from "@/queries/analyze";
import { useResultStore } from "@/store/result-store";

export const useOpenBookmark = () => {
  const router = useRouter();
  const analyze = useAnalyzeRecipe();
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [failedId, setFailedId] = useState<number | null>(null);

  const openText = (item: Bookmark, text: string) => {
    if (openingId !== null) return;
    setFailedId(null);
    setOpeningId(item.id);
    analyze.mutate(
      { type: "text", text },
      {
        onSuccess: (response) => {
          if (response.status !== "success") {
            setFailedId(item.id);
            return;
          }
          useResultStore.getState().open({ type: "text", text }, response.data);
          router.push("/result");
        },
        onError: () => setFailedId(item.id),
        onSettled: () => setOpeningId(null),
      },
    );
  };

  return { openingId, failedId, openText };
};
