"use client";

import { PantryPicker } from "@/components/pantry/pantry-picker";
import { PantryResults } from "@/components/pantry/pantry-results";
import { usePantry } from "@/hooks/use-pantry";

export const PantryContent = () => {
  const { picker, results } = usePantry();

  return (
    <>
      <PantryPicker {...picker} />
      <PantryResults {...results} />
    </>
  );
};
