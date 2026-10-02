import "server-only";
import type { PantryExtraIngredient, PantryMenu } from "@recipe-web/api";
import { generateJsonWithRetry, pickModels } from "@/server/recipe/llm/gemini.js";
import { canonicalize, priceItem } from "@/server/recipe/price/index.js";

export const MENU_COUNT = 4;
export const MAX_EXTRAS_PER_MENU = 8;
export const CACHE_MAX = 50;
export const CACHE_TTL_MS = 60 * 60 * 1000;
const LLM_TIMEOUT_MS = 60_000;
const LLM_ATTEMPTS = 2;

const SYSTEM = `당신은 집에 있는 재료로 만들 요리를 추천하는 요리사입니다.

규칙:
- 요리 장르에 제한이 없습니다. 한식·양식·중식·일식 어느 쪽이든 보유 재료에 가장 잘 맞는 메뉴를 고르세요.
- 메뉴는 ${MENU_COUNT}개, 서로 다른 요리로 추천합니다.
- uses 에는 "보유 재료" 목록에 있는 표기만, 그대로 적습니다. 목록에 없는 재료를 uses 에 넣지 마세요.
- extras 에는 **그 메뉴의 일반적인 레시피에 들어가는 주요 재료 가운데 보유 재료 목록에 없는 것을 전부** 적습니다.
  보유 재료만 보고 "이걸로 충분하다"고 좁히지 말고, 표준 레시피를 기준으로 부족한 재료를 빠짐없이 알려주세요.
  (예: 김치찌개인데 두부·양파가 목록에 없으면 extras 에 두부, 양파를 적습니다) 메뉴당 최대 ${MAX_EXTRAS_PER_MENU}개.
- 어느 집에나 있는 기본 조미료(소금·후추·설탕·간장·식용유·참기름·물)만 extras 에서 제외합니다.
  고춧가루·고추장·된장·굴소스 같은 장류·특수 조미료는 레시피에 필요하면 extras 에 포함합니다.
- 재료명은 브랜드 없이 일반 명사로 적습니다. (예: "오뚜기 카레가루" → "카레가루")
- description 은 이 재료 조합에서 왜 이 메뉴인지 한 문장으로 씁니다.
- 표준 레시피의 주요 재료가 보유 재료로 전부 해결될 때만 extras 를 빈 배열로 두세요.`;

const SCHEMA = {
  type: "OBJECT" as const,
  properties: {
    menus: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "메뉴 이름" },
          description: { type: "STRING", description: "한 문장 설명" },
          uses: { type: "ARRAY", items: { type: "STRING" }, description: "보유 재료 중 쓰는 것 (그대로)" },
          extras: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "일반적인 레시피 기준, 보유 목록에 없어 사야 하는 주요 재료 전부",
          },
        },
        required: ["name", "description", "uses", "extras"],
      },
    },
  },
  required: ["menus"],
};

type LlmMenus = {
  menus?: { name?: string; description?: string; uses?: string[]; extras?: string[] }[];
};

type CacheEntry = { menus: PantryMenu[]; expiresAt: number };

const cache = new Map<string, CacheEntry>();
let modelPromise: Promise<string> | null = null;

const defaultModel = (): Promise<string> => {
  if (!modelPromise) {
    modelPromise = pickModels()
      .then((names) => names.find((name) => /lite/i.test(name)) ?? names[0])
      .catch((error: unknown) => {
        modelPromise = null;
        throw error;
      });
  }
  return modelPromise;
};

const readCache = (key: string): PantryMenu[] | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.menus;
};

const writeCache = (key: string, menus: PantryMenu[]): void => {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { menus, expiresAt: Date.now() + CACHE_TTL_MS });
};

const priceExtra = async (name: string): Promise<PantryExtraIngredient> => {
  const canonical = canonicalize(name);
  if (!canonical) {
    return { name, canonical: null, packCost: null, packLabel: null, priceConfidence: null, hasPrice: false };
  }

  const priced = await priceItem({ name, qty: null, unit: null, amount: { value: 1, base: "g" } });
  const pack = priced.pack ?? null;
  return {
    name,
    canonical,
    packCost: pack ? pack.price : null,
    packLabel: pack ? `${pack.label} ${pack.price.toLocaleString("ko-KR")}원` : null,
    priceConfidence: priced.priceSource ? (priced.priceSource.live ? "actual" : "estimate") : null,
    hasPrice: pack != null,
  };
};

export const recommendMenus = async (rawIngredients: string[]): Promise<PantryMenu[]> => {
  const ingredients = [...new Set(rawIngredients.map((name) => name.trim()).filter(Boolean))];
  const key = [...ingredients].sort().join("|");

  const cached = readCache(key);
  if (cached) return cached;

  const model = await defaultModel();
  const user = `## 보유 재료\n${ingredients.map((name, index) => `${index + 1}. ${name}`).join("\n")}`;

  const { data } = await generateJsonWithRetry<LlmMenus>(
    { model, system: SYSTEM, user, schema: SCHEMA, timeout: LLM_TIMEOUT_MS },
    { attempts: LLM_ATTEMPTS },
  );

  const owned = new Set(ingredients);
  const drafts: { name: string; description: string; uses: string[]; extras: string[] }[] = [];
  for (const menu of data?.menus ?? []) {
    const name = String(menu?.name ?? "").trim();
    if (!name) continue;
    drafts.push({
      name,
      description: String(menu?.description ?? "").trim(),
      uses: (menu?.uses ?? []).map((item) => String(item).trim()).filter((item) => owned.has(item)),
      extras: [...new Set((menu?.extras ?? []).map((item) => String(item).trim()).filter(Boolean))].slice(
        0,
        MAX_EXTRAS_PER_MENU,
      ),
    });
  }

  const priced = new Map<string, PantryExtraIngredient>();
  for (const extra of new Set(drafts.flatMap((draft) => draft.extras))) {
    priced.set(extra, await priceExtra(extra));
  }

  const menus: PantryMenu[] = drafts
    .map((draft) => {
      const extraIngredients = draft.extras.map((extra) => priced.get(extra) as PantryExtraIngredient);
      return {
        name: draft.name,
        description: draft.description,
        usedIngredients: draft.uses,
        extraIngredients,
        extraCost: extraIngredients.reduce((sum, extra) => sum + (extra.packCost ?? 0), 0),
        unpricedCount: extraIngredients.filter((extra) => !extra.hasPrice).length,
      };
    })
    .sort((a, b) => a.extraCost - b.extraCost || a.unpricedCount - b.unpricedCount);

  if (menus.length > 0) writeCache(key, menus);
  return menus;
};
