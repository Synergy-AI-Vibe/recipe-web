import { useState, type FormEvent } from "react";
import { PANTRY_MAX_INGREDIENTS } from "@recipe-web/api";
import { POPULAR_INGREDIENTS } from "@/constants/pantry";
import { addIngredient, getPantryHint, normalizeIngredient, toPantryView } from "@/lib/pantry";
import { useSearchPantry } from "@/queries/pantry";

export const usePantry = () => {
  const [chosen, setChosen] = useState<string[]>([]);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const search = useSearchPantry();

  const isFull = chosen.length >= PANTRY_MAX_INGREDIENTS;
  const chosenKeys = new Set(chosen.map(normalizeIngredient));

  const changeChosen = (next: string[]) => {
    setChosen(next);
    setIsDuplicate(false);
    search.reset();
  };

  const add = (label: string) => {
    const result = addIngredient(chosen, label);
    if (result.status === "duplicate") setIsDuplicate(true);
    if (result.status === "added") changeChosen(result.chosen);
  };

  const remove = (label: string) => {
    changeChosen(chosen.filter((item) => item !== label));
  };

  const clear = () => changeChosen([]);

  const submit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (chosen.length === 0 || search.isPending) return;
    search.mutate(chosen);
  };

  return {
    picker: {
      chosen,
      isFull,
      hint: getPantryHint(isDuplicate, isFull),
      popular: POPULAR_INGREDIENTS.filter((label) => !chosenKeys.has(normalizeIngredient(label))),
      pending: search.isPending,
      onAdd: add,
      onRemove: remove,
      onClear: clear,
      onSubmit: submit,
    },
    results: {
      view: toPantryView(search),
      onRetry: submit,
      onReset: clear,
    },
  };
};
