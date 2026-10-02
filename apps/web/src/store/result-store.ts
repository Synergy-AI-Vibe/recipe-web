import { analyzeDataSchema } from "@recipe-web/api";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ResultAdjustments, ResultSource, ResultState, ResultStore } from "@/types/result";

export const RESULT_STORAGE_KEY = "recipe-web:result";

const emptyState: ResultState = { source: null, data: null, adjustments: {} };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseSource = (value: unknown): ResultSource | null => {
  if (!isRecord(value)) return null;
  if (value.type === "youtube" && typeof value.url === "string") {
    return { type: "youtube", url: value.url };
  }
  if (value.type === "text" && typeof value.text === "string") {
    return { type: "text", text: value.text };
  }
  return null;
};

const parseAdjustments = (value: unknown): ResultAdjustments =>
  isRecord(value) ? (value as ResultAdjustments) : {};

export const useResultStore = create<ResultStore>()(
  persist(
    (set, get) => ({
      ...emptyState,
      open: (source, data) => set({ source, data, adjustments: {} }),
      toggleIngredient: (id) => {
        const { data, adjustments } = get();
        const row = data?.ingredients.find((ingredient) => ingredient.id === id);
        if (!row) return;
        const current = adjustments[id]?.checked ?? row.checked;
        set({ adjustments: { ...adjustments, [id]: { ...adjustments[id], checked: !current } } });
      },
      setUserPrice: (id, value) => {
        const { data, adjustments } = get();
        if (!data?.ingredients.some((ingredient) => ingredient.id === id)) return;
        set({ adjustments: { ...adjustments, [id]: { ...adjustments[id], userPrice: value } } });
      },
      clear: () => set(emptyState),
    }),
    {
      name: RESULT_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      version: 1,
      partialize: ({ source, data, adjustments }) => ({ source, data, adjustments }),
      merge: (persisted, current) => {
        if (!isRecord(persisted)) return current;
        const data = analyzeDataSchema.safeParse(persisted.data);
        const source = parseSource(persisted.source);
        if (!data.success || !source) return current;
        return {
          ...current,
          source,
          data: data.data,
          adjustments: parseAdjustments(persisted.adjustments),
        };
      },
    },
  ),
);
