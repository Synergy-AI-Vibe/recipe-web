import { describe, expect, it } from "vitest";
import {
  computeTotals,
  computeWarnings,
  formatPercent,
  formatWon,
  rowBasketCost,
  rowIngredientCost,
} from "@/lib/calc";
import { missingPriceIngredient, sampleIngredients, sampleStore } from "@/lib/fixtures/analyze-data";

describe("computeTotals", () => {
  it("체크된 재료의 합계, 장바구니, 절약 금액, 1인분을 계산한다", () => {
    expect(computeTotals(sampleIngredients, sampleStore, 2)).toEqual({
      ingredientTotal: 8300,
      basketTotal: 24900,
      perServing: 4150,
      savings: 10700,
      savingsPercent: 56.3,
      barPercent: 43.7,
    });
  });

  it("집에 있는 재료의 체크를 풀면 합계에서 빠진다", () => {
    const rows = sampleIngredients.map((row) => (row.id === 1 ? { ...row, checked: false } : row));
    const totals = computeTotals(rows, sampleStore, 2);

    expect(totals.ingredientTotal).toBe(4300);
    expect(totals.basketTotal).toBe(15900);
    expect(totals.savings).toBe(14700);
  });

  it("가격 없는 재료는 직접 입력한 금액만 합계에 더한다", () => {
    const rows = [...sampleIngredients, missingPriceIngredient];

    expect(computeTotals(rows, sampleStore, 2).ingredientTotal).toBe(8300);
    const entered = rows.map((row) => (row.id === 6 ? { ...row, userPrice: 1500 } : row));
    const totals = computeTotals(entered, sampleStore, 2);
    expect(totals.ingredientTotal).toBe(9800);
    expect(totals.basketTotal).toBe(26400);
  });

  it("체크를 푼 재료는 직접 입력한 금액도 더하지 않는다", () => {
    const row = { ...missingPriceIngredient, userPrice: 1500, checked: false };

    expect(rowIngredientCost(row)).toBe(0);
    expect(rowBasketCost(row)).toBe(0);
  });

  it("사 먹는 가격이 없으면 비교 값을 모두 0으로 둔다", () => {
    const totals = computeTotals(sampleIngredients, null, 2);

    expect(totals.ingredientTotal).toBe(8300);
    expect(totals.savings).toBe(0);
    expect(totals.savingsPercent).toBe(0);
    expect(totals.barPercent).toBe(0);
  });

  it("재료비가 사 먹는 가격보다 크면 절약 금액은 0원이고 막대는 100%에서 멈춘다", () => {
    const totals = computeTotals(sampleIngredients, { ...sampleStore, avg: 5000 }, 2);

    expect(totals.savings).toBe(0);
    expect(totals.savingsPercent).toBe(0);
    expect(totals.barPercent).toBe(100);
  });

  it("인분 수가 0 이하이면 1인분으로 계산한다", () => {
    expect(computeTotals(sampleIngredients, sampleStore, 0).perServing).toBe(8300);
  });

  it("주재료 하나의 가격이 빠지면 합계가 크게 어긋난다 (기존 서비스에서 8,522원이 26,198원이던 사례)", () => {
    const base = sampleIngredients[0];
    const withMain = [
      { ...base, id: 1, unitCost: 8522 },
      { ...base, id: 2, unitCost: 17676 },
    ];
    const withoutMain = [withMain[0], { ...withMain[1], hasPrice: false, unitCost: null }];

    expect(computeTotals(withMain, sampleStore, 2).ingredientTotal).toBe(26198);
    expect(computeTotals(withoutMain, sampleStore, 2).ingredientTotal).toBe(8522);
  });
});

describe("computeWarnings", () => {
  it("모든 재료에 가격이 있으면 경고가 없고 추정 가격 개수를 센다", () => {
    expect(computeWarnings(sampleIngredients)).toEqual({
      missingMain: [],
      missingSeasoning: [],
      estimatedCount: 2,
      pricedCount: 5,
    });
  });

  it("가격 없는 주재료와 조미료를 나눠서 모은다", () => {
    const seasoning = { ...missingPriceIngredient, id: 7, rawText: "후추", name: "후추", role: "seasoning" as const };
    const warnings = computeWarnings([...sampleIngredients, missingPriceIngredient, seasoning]);

    expect(warnings.missingMain).toEqual(["사골육수 팩"]);
    expect(warnings.missingSeasoning).toEqual(["후추"]);
    expect(warnings.pricedCount).toBe(5);
  });

  it("금액을 직접 입력하면 경고가 사라지고, 0원이면 입력하지 않은 것으로 본다", () => {
    const entered = { ...missingPriceIngredient, userPrice: 1500 };
    const cleared = { ...missingPriceIngredient, userPrice: 0 };

    expect(computeWarnings([entered]).missingMain).toEqual([]);
    expect(computeWarnings([entered]).pricedCount).toBe(1);
    expect(computeWarnings([cleared]).missingMain).toEqual(["사골육수 팩"]);
  });

  it("체크를 푼 재료는 경고와 개수에서 제외한다", () => {
    const unchecked = { ...missingPriceIngredient, checked: false };

    expect(computeWarnings([unchecked])).toEqual({
      missingMain: [],
      missingSeasoning: [],
      estimatedCount: 0,
      pricedCount: 0,
    });
  });
});

describe("표시 형식", () => {
  it("금액은 천 단위 쉼표가 있는 정수로 표시한다", () => {
    expect(formatWon(1234567)).toBe("1,234,567");
    expect(formatWon(999.6)).toBe("1,000");
  });

  it("퍼센트는 소수점 한 자리로 표시한다", () => {
    expect(formatPercent(56)).toBe("56.0");
    expect(formatPercent(56.34)).toBe("56.3");
  });
});
