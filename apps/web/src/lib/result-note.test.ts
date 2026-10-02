import { describe, expect, it } from "vitest";
import { missingPriceIngredient, sampleIngredients } from "@/lib/fixtures/analyze-data";
import { buildAdjustmentNote } from "@/lib/result-note";

describe("buildAdjustmentNote", () => {
  it("조정한 것이 없으면 안내를 만들지 않는다", () => {
    expect(buildAdjustmentNote(sampleIngredients)).toBeNull();
  });

  it("집에 있는 재료를 뺀 개수와 금액을 알려 준다", () => {
    const rows = sampleIngredients.map((row) => (row.id <= 2 ? { ...row, checked: false } : row));

    expect(buildAdjustmentNote(rows)).toBe("집에 있는 재료 2개 6,400원 제외됨");
  });

  it("직접 입력한 금액을 알려 준다", () => {
    const rows = [...sampleIngredients, { ...missingPriceIngredient, userPrice: 1500 }];

    expect(buildAdjustmentNote(rows)).toBe("사골육수 팩은 직접 입력한 1,500원으로 계산했습니다");
  });

  it("금액을 넣기 전까지 합계에 없는 재료를 알려 준다", () => {
    const rows = [...sampleIngredients, missingPriceIngredient];

    expect(buildAdjustmentNote(rows)).toBe("사골육수 팩은 금액을 넣기 전까지 합계에 없습니다");
  });

  it("여러 재료는 개수로 묶어서 알려 준다", () => {
    const second = { ...missingPriceIngredient, id: 7, rawText: "후추" };
    const rows = [...sampleIngredients, missingPriceIngredient, second];

    expect(buildAdjustmentNote(rows)).toBe("재료 2개는 금액을 넣기 전까지 합계에 없습니다");
  });

  it("집에 있는 재료 제외 안내가 직접 입력 안내보다 먼저 나온다", () => {
    const rows = [
      { ...sampleIngredients[0], checked: false },
      { ...missingPriceIngredient, userPrice: 1500 },
    ];

    expect(buildAdjustmentNote(rows)).toBe("집에 있는 재료 1개 4,000원 제외됨");
  });
});
