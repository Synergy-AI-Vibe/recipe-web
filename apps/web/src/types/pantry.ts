import type { PantryMenu } from "@recipe-web/api";

export type PantryView =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; menus: PantryMenu[] }
  | { kind: "empty" }
  | { kind: "failed" };

export type PantryHint = {
  text: string;
  tone: "default" | "alert";
};

export type AddIngredientResult = {
  chosen: string[];
  status: "added" | "duplicate" | "full" | "empty";
};

export type PantryCostLabel = {
  primary: string;
  secondary: string | null;
};
