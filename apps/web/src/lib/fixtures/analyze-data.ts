import type { AnalyzeData, IngredientRow, StorePrice } from "@recipe-web/api";
import { computeTotals, computeWarnings } from "@/lib/calc";

const SERVINGS = 2;

const createRow = (overrides: Partial<IngredientRow> & Pick<IngredientRow, "id" | "rawText">): IngredientRow => ({
  name: overrides.rawText,
  role: "main",
  qty: null,
  unit: null,
  amount: null,
  amountUnit: null,
  conversionNote: null,
  needsConfirm: false,
  unitCost: null,
  packCost: null,
  packLabel: null,
  priceTier: 1,
  priceConfidence: "actual",
  hasPrice: true,
  checked: true,
  userPrice: null,
  ...overrides,
});

export const sampleStore: StorePrice = {
  menuName: "김치찌개",
  min: 16000,
  max: 22000,
  avg: 19000,
  deliveryFee: 3000,
  sampleSize: 12,
  surveyedOn: "2026-09-01",
};

export const sampleIngredients: IngredientRow[] = [
  createRow({
    id: 1,
    rawText: "돼지고기 앞다리살 200g",
    name: "돼지고기",
    qty: 200,
    unit: "g",
    amount: 200,
    amountUnit: "g",
    unitCost: 4000,
    packCost: 9000,
    packLabel: "500g 9,000원",
  }),
  createRow({
    id: 2,
    rawText: "신김치 300g",
    name: "김치",
    qty: 300,
    unit: "g",
    amount: 300,
    amountUnit: "g",
    unitCost: 2400,
    packCost: 5900,
    packLabel: "1kg 5,900원",
    priceTier: 2,
    priceConfidence: "estimate",
  }),
  createRow({
    id: 3,
    rawText: "두부 1/2모",
    name: "두부",
    qty: 0.5,
    unit: "모",
    amount: 150,
    amountUnit: "g",
    conversionNote: "1/2모 → 150g",
    unitCost: 900,
    packCost: 2000,
    packLabel: "1모 2,000원",
  }),
  createRow({
    id: 4,
    rawText: "대파 1대",
    name: "대파",
    role: "seasoning",
    qty: 1,
    unit: "대",
    amount: 50,
    amountUnit: "g",
    conversionNote: "1대 → 50g",
    unitCost: 300,
    packCost: 1500,
    packLabel: "1단 1,500원",
    priceTier: 2,
    priceConfidence: "estimate",
  }),
  createRow({
    id: 5,
    rawText: "고춧가루 2큰술",
    name: "고춧가루",
    role: "seasoning",
    qty: 2,
    unit: "큰술",
    amount: 14,
    amountUnit: "g",
    conversionNote: "2큰술 → 14g",
    unitCost: 700,
    packCost: 6500,
    packLabel: "500g 6,500원",
  }),
];

export const missingPriceIngredient: IngredientRow = createRow({
  id: 6,
  rawText: "사골육수 팩",
  name: null,
  needsConfirm: true,
  hasPrice: false,
  priceTier: null,
  priceConfidence: null,
});

export const createAnalyzeData = (
  overrides: { ingredients?: IngredientRow[]; store?: StorePrice | null; servings?: number } = {},
): AnalyzeData => {
  const ingredients = overrides.ingredients ?? sampleIngredients;
  const store = overrides.store === undefined ? sampleStore : overrides.store;
  const servings = overrides.servings ?? SERVINGS;

  return {
    recipe: {
      title: "돼지고기 김치찌개",
      servings,
      sourceType: "youtube",
      sourceUrl: "https://youtu.be/sample0001",
      thumbnailUrl: null,
      channelName: "자취요리연구소",
      steps: [],
      rawText: "돼지고기 앞다리살 200g\n신김치 300g\n두부 1/2모\n대파 1대\n고춧가루 2큰술",
    },
    ingredients,
    store,
    totals: computeTotals(ingredients, store, servings),
    warnings: computeWarnings(ingredients),
    priceBaseDate: "2026-09-01",
    normalize: null,
  };
};

export const sampleAnalyzeData = createAnalyzeData();

export const sampleNoStoreData = createAnalyzeData({ store: null });

export const sampleMissingMainData = createAnalyzeData({
  ingredients: [...sampleIngredients, missingPriceIngredient],
});
