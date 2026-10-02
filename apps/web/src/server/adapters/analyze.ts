import "server-only";
import type { AnalyzeData, AnalyzeResponse, IngredientRow, Recipe, StorePrice } from "@recipe-web/api";
import { computeTotals, computeWarnings } from "@/lib/calc";
import { matchStorePrice } from "@/server/data/store-price";
import type { PocItem, PocPriceSource, PocResult } from "@/server/recipe/analyze.js";
import { estimateStorePrice } from "@/server/recipe/price/llm-store-price.js";

type AnalyzeInput = { url?: string; text?: string };

const YOUTUBE_ID = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const NOT_FOUND_MESSAGE = "영상에서 재료를 찾지 못했어요. 아래에 직접 적어주시면 바로 계산해 드릴게요.";
const UNTITLED = "이름 없는 레시피";
const COOKING_STEP_SUFFIX = /(하기|준비|방법|만들기|손질|밑간)$/;

const thumbnailFromUrl = (url?: string): string | null => {
  if (!url) return null;
  const match = YOUTUBE_ID.exec(url);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : null;
};

const today = (): string => new Date().toISOString().slice(0, 10);

const latestAsOf = (items: PocItem[]): string | null => {
  let latest: string | null = null;
  for (const item of items) {
    const date = item.priceSource?.asOf;
    if (date && (latest === null || date > latest)) latest = date;
  }
  return latest;
};

const looksLikeArtifact = (item: PocItem): boolean => {
  if (item.canonical) return false;
  if (item.unit === "인분") return true;
  if (item.qty != null || item.unit) return false;
  return COOKING_STEP_SUFFIX.test(item.name.trim());
};

const toConfidence = (source: PocPriceSource | null): IngredientRow["priceConfidence"] => {
  if (!source) return null;
  if (source.tier === 3) return "user";
  return source.live ? "actual" : "estimate";
};

const toRow = (item: PocItem, index: number): IngredientRow => ({
  id: index + 1,
  rawText: item.raw,
  name: item.canonical,
  role: item.category === "조미료" || looksLikeArtifact(item) ? "seasoning" : "main",
  qty: item.qty,
  unit: item.unit,
  amount: item.amount?.value ?? null,
  amountUnit: item.amount?.base ?? null,
  conversionNote: item.amount?.basis ?? item.amountIssue?.detail ?? null,
  needsConfirm: item.amount == null,
  unitCost: item.cost,
  packCost: item.packCost,
  packLabel: item.pack ? `${item.pack.label} ${item.pack.price.toLocaleString("ko-KR")}원` : null,
  priceTier: item.priceSource?.tier ?? null,
  priceConfidence: toConfidence(item.priceSource),
  hasPrice: item.cost != null,
  checked: true,
  userPrice: null,
});

const resolveStorePrice = async (title: string): Promise<StorePrice | null> => {
  const estimated = await estimateStorePrice(title);
  if (estimated) return estimated;
  return matchStorePrice(title);
};

export const toAnalyzeResponse = async (poc: PocResult, input: AnalyzeInput): Promise<AnalyzeResponse> => {
  const items = poc.pricing?.items ?? [];

  if (!poc.fetched?.ok || items.length === 0) {
    return {
      status: "no_recipe_found",
      videoTitle: poc.fetched?.title ?? null,
      thumbnailUrl: thumbnailFromUrl(input.url),
      message: poc.fetched?.message ?? NOT_FOUND_MESSAGE,
    };
  }

  const servings = poc.servings?.used ?? poc.pricing?.servings ?? 1;
  const ingredients = items.map(toRow);
  const title = poc.fetched.title ?? "";
  const isManual = poc.fetched.source === "manual";
  const store = title && !isManual ? await resolveStorePrice(title) : null;

  const recipe: Recipe = {
    title: title || UNTITLED,
    servings,
    sourceType: isManual ? "manual" : "youtube",
    sourceUrl: input.url ?? null,
    thumbnailUrl: thumbnailFromUrl(input.url),
    channelName: poc.fetched.channel ?? null,
    steps: [],
    rawText: isManual ? null : poc.fetched.text || null,
  };

  const data: AnalyzeData = {
    recipe,
    ingredients,
    store,
    totals: computeTotals(ingredients, store, servings),
    warnings: computeWarnings(ingredients),
    priceBaseDate: latestAsOf(items) ?? poc.priceMeta?.asOf ?? today(),
    normalize: poc.normalize ?? null,
  };

  return { status: "success", data };
};
