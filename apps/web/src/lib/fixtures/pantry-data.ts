import type { PantryMenu } from "@recipe-web/api";

export const samplePantryMenus: PantryMenu[] = [
  {
    name: "김치볶음밥",
    description: "신김치와 밥만 있으면 바로 만들 수 있습니다",
    usedIngredients: ["신김치", "밥", "계란"],
    extraIngredients: [],
    extraCost: 0,
    unpricedCount: 0,
  },
  {
    name: "돼지고기 김치찌개",
    description: "돼지고기와 신김치로 끓이는 찌개입니다",
    usedIngredients: ["돼지고기", "신김치"],
    extraIngredients: [
      {
        name: "두부",
        canonical: "두부",
        packCost: 2000,
        packLabel: "1모 2,000원",
        priceConfidence: "actual",
        hasPrice: true,
      },
      {
        name: "대파",
        canonical: "대파",
        packCost: 1500,
        packLabel: "1단 1,500원",
        priceConfidence: "estimate",
        hasPrice: true,
      },
    ],
    extraCost: 3500,
    unpricedCount: 0,
  },
  {
    name: "돼지고기 두루치기",
    description: "매콤하게 볶아 밥과 함께 먹습니다",
    usedIngredients: ["돼지고기"],
    extraIngredients: [
      {
        name: "양파",
        canonical: "양파",
        packCost: 3000,
        packLabel: "1.5kg 3,000원",
        priceConfidence: "actual",
        hasPrice: true,
      },
      {
        name: "쌈장 소스",
        canonical: null,
        packCost: null,
        packLabel: null,
        priceConfidence: null,
        hasPrice: false,
      },
    ],
    extraCost: 3000,
    unpricedCount: 1,
  },
];
