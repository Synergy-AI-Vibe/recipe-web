import { describe, expect, it } from "vitest";
import { getAmountText, getDisplayName } from "@/lib/ingredient-text";
import { missingPriceIngredient, sampleIngredients } from "@/lib/fixtures/analyze-data";

describe("getAmountText", () => {
  it("환산값이 있으면 환산값을 보여 준다", () => {
    expect(getAmountText(sampleIngredients[2])).toBe("150g");
  });

  it("환산값이 없으면 원문 수량과 단위를 보여 준다", () => {
    expect(getAmountText({ ...sampleIngredients[2], amount: null, amountUnit: null })).toBe("0.5모");
  });

  it("둘 다 없으면 null이다", () => {
    expect(getAmountText(missingPriceIngredient)).toBeNull();
  });
});

describe("getDisplayName", () => {
  it("표준 재료명을 우선하고 없으면 원문을 쓴다", () => {
    expect(getDisplayName(sampleIngredients[0])).toBe("돼지고기");
    expect(getDisplayName(missingPriceIngredient)).toBe("사골육수 팩");
  });
});
