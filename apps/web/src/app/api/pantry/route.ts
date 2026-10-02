import { PANTRY_MAX_INGREDIENTS, PANTRY_MAX_NAME_LENGTH, type PantryResponse } from "@recipe-web/api";
import { jsonResponse, logServerError } from "@/server/api-response";
import { recommendMenus } from "@/server/pantry/recommend";

export const runtime = "nodejs";
export const maxDuration = 60;

const failure = (reason: "invalid_input" | "no_menu" | "failed", message: string): PantryResponse => ({
  status: "error",
  reason,
  message,
});

const cleanIngredients = (value: unknown): string[] | null => {
  if (typeof value !== "object" || value === null) return null;
  const { ingredients } = value as { ingredients?: unknown };
  if (!Array.isArray(ingredients)) return null;
  const names = ingredients.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  return [...new Set(names)];
};

export async function POST(request: Request): Promise<Response> {
  const ingredients = cleanIngredients(await request.json().catch(() => null));
  if (!ingredients) {
    return jsonResponse(failure("invalid_input", "요청을 읽지 못했어요."), 400);
  }
  if (ingredients.length === 0 || ingredients.length > PANTRY_MAX_INGREDIENTS) {
    return jsonResponse(
      failure("invalid_input", `재료를 1개부터 ${PANTRY_MAX_INGREDIENTS}개까지 골라주세요.`),
      400,
    );
  }
  if (ingredients.some((name) => name.length > PANTRY_MAX_NAME_LENGTH)) {
    return jsonResponse(
      failure("invalid_input", `재료 이름은 ${PANTRY_MAX_NAME_LENGTH}자까지 쓸 수 있어요.`),
      400,
    );
  }

  try {
    const menus = await recommendMenus(ingredients);
    if (menus.length === 0) {
      return jsonResponse(
        failure("no_menu", "이 조합으로는 추천을 만들지 못했어요. 재료를 바꿔 다시 시도해 주세요."),
      );
    }
    return jsonResponse({ status: "success", menus } satisfies PantryResponse);
  } catch (error) {
    logServerError("[POST /api/pantry]", error);
    return jsonResponse(failure("failed", "추천을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."), 502);
  }
}
