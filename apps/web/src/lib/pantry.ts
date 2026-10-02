import {
  PANTRY_MAX_INGREDIENTS,
  PANTRY_MAX_NAME_LENGTH,
  type PantryMenu,
  type PantryResponse,
} from "@recipe-web/api";
import type {
  AddIngredientResult,
  PantryCostLabel,
  PantryHint,
  PantryView,
} from "@/types/pantry";

const formatWon = (value: number): string => Math.round(value).toLocaleString("ko-KR");

export const normalizeIngredient = (label: string): string => label.trim().toLowerCase();

export const addIngredient = (chosen: string[], label: string): AddIngredientResult => {
  const trimmed = label.trim();
  if (!trimmed) return { chosen, status: "empty" };
  if (chosen.length >= PANTRY_MAX_INGREDIENTS) return { chosen, status: "full" };
  const key = normalizeIngredient(trimmed);
  if (chosen.some((item) => normalizeIngredient(item) === key)) return { chosen, status: "duplicate" };
  return { chosen: [...chosen, trimmed], status: "added" };
};

export const getPantryHint = (isDuplicate: boolean, isFull: boolean): PantryHint => {
  if (isDuplicate) return { text: "이미 담긴 재료입니다", tone: "alert" };
  if (isFull) {
    return {
      text: `재료 ${PANTRY_MAX_INGREDIENTS}개를 모두 골랐습니다. 하나를 지우면 다시 입력할 수 있습니다.`,
      tone: "default",
    };
  }
  return {
    text: `목록에 없는 재료는 직접 입력하고 Enter를 누르세요. ${PANTRY_MAX_NAME_LENGTH}자까지.`,
    tone: "default",
  };
};

type SearchState = {
  isPending: boolean;
  isError: boolean;
  data: PantryResponse | undefined;
};

export const toPantryView = ({ isPending, isError, data }: SearchState): PantryView => {
  if (isPending) return { kind: "loading" };
  if (data?.status === "success") {
    return data.menus.length === 0 ? { kind: "empty" } : { kind: "success", menus: data.menus };
  }
  if (data?.status === "error") {
    return data.reason === "no_menu" ? { kind: "empty" } : { kind: "failed" };
  }
  if (isError) return { kind: "failed" };
  return { kind: "idle" };
};

export const getCostLabel = (menu: PantryMenu): PantryCostLabel => {
  if (menu.unpricedCount === 0) {
    return { primary: `추가 ${formatWon(menu.extraCost)}원`, secondary: null };
  }
  return {
    primary: `최소 ${formatWon(menu.extraCost)}원`,
    secondary: `가격 미확인 ${menu.unpricedCount}개`,
  };
};

export const getMenuMeta = (menu: PantryMenu): string => {
  if (menu.extraIngredients.length === 0) return menu.description;
  return `사야 할 재료 ${menu.extraIngredients.map((extra) => extra.name).join(", ")}`;
};

export const getResultAnnouncement = (view: PantryView): string => {
  switch (view.kind) {
    case "loading":
      return "추천을 찾는 중입니다";
    case "success":
      return `만들 수 있는 레시피 ${view.menus.length}개를 찾았습니다`;
    case "empty":
      return "이 재료로 만들 수 있는 레시피가 없습니다";
    case "failed":
      return "추천을 불러오지 못했습니다";
    default:
      return "";
  }
};
