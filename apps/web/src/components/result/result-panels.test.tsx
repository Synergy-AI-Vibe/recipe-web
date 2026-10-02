import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  missingPriceIngredient,
  sampleAnalyzeData,
  sampleIngredients,
  sampleStore,
} from "@/lib/fixtures/analyze-data";
import { computeTotals, computeWarnings } from "@/lib/calc";
import { IngredientsPanel } from "@/components/result/ingredients-panel";
import { SavingsPanel } from "@/components/result/savings-panel";
import { StepsPanel } from "@/components/result/steps-panel";
import type { IngredientRow } from "@recipe-web/api";

const renderSavings = (ingredients: IngredientRow[], store = sampleStore as typeof sampleStore | null) =>
  renderToStaticMarkup(
    <SavingsPanel
      recipe={sampleAnalyzeData.recipe}
      store={store}
      totals={computeTotals(ingredients, store, 2)}
      warnings={computeWarnings(ingredients)}
      priceBaseDate="2026-09-01"
    />,
  );

const renderIngredients = (ingredients: IngredientRow[], adjustmentNote: string | null = null) =>
  renderToStaticMarkup(
    <IngredientsPanel
      ingredients={ingredients}
      totals={computeTotals(ingredients, sampleStore, 2)}
      warnings={computeWarnings(ingredients)}
      priceBaseDate="2026-09-01"
      adjustmentNote={adjustmentNote}
      onToggleIngredient={() => undefined}
      onPriceChange={() => undefined}
    />,
  );

describe("SavingsPanel", () => {
  it("절약 금액과 사 먹을 때·직접 만들 때 금액을 보여 준다", () => {
    const html = renderSavings(sampleIngredients);

    expect(html).toContain("10,700");
    expect(html).toContain("아낍니다");
    expect(html).toContain("사 먹으면 19,000원, 직접 만들면 8,300원");
    expect(html).toContain("56.3%");
    expect(html).toContain("9월 1일 기준");
    expect(html).not.toContain("가격을 찾지 못한 주재료");
  });

  it("사 먹는 가격이 없으면 비교 영역을 접고 재료비 합계만 보여 준다", () => {
    const html = renderSavings(sampleIngredients, null);

    expect(html).toContain("비교할 매장가 정보가 없습니다");
    expect(html).toContain("8,300원");
    expect(html).not.toContain("아낍니다");
  });

  it("가격을 찾지 못한 주재료가 있으면 경고를 띄운다", () => {
    const html = renderSavings([...sampleIngredients, missingPriceIngredient]);

    expect(html).toContain("가격을 찾지 못한 주재료가 있어요");
    expect(html).toContain("사골육수 팩");
  });
});

describe("IngredientsPanel", () => {
  it("재료 목록과 합계, 장바구니 금액, 추정 가격 개수, 가격 출처를 보여 준다", () => {
    const html = renderIngredients(sampleIngredients);

    expect(html).toContain("돼지고기");
    expect(html).toContain("재료비 합계");
    expect(html).toContain("8,300원");
    expect(html).toContain("최소 <b");
    expect(html).toContain("24,900원");
    expect(html).toContain("5개 중 2개는 추정 가격입니다");
    expect(html).toContain("KAMIS 농산물유통정보");
  });

  it("체크를 푼 재료는 계산에서 제외했다고 알리고 금액에 취소선을 긋는다", () => {
    const rows = sampleIngredients.map((row) => (row.id === 1 ? { ...row, checked: false } : row));
    const html = renderIngredients(rows, "집에 있는 재료 1개 4,000원 제외됨");

    expect(html).toContain("집에 있음 · 계산에서 제외");
    expect(html).toContain("line-through");
    expect(html).toContain("집에 있는 재료 1개 4,000원 제외됨");
  });

  it("가격 없는 주재료는 금액 입력칸과 안내를 보여 준다", () => {
    const html = renderIngredients([...sampleIngredients, missingPriceIngredient]);

    expect(html).toContain("사골육수 팩 금액 직접 입력");
    expect(html).toContain("금액 없음");
    expect(html).toContain("사골육수 팩</b>은 가격 데이터가 없습니다");
  });

  it("합계가 바뀌면 스크린리더가 알려 주도록 변경을 읽어 주는 영역이 있다", () => {
    const html = renderIngredients(sampleIngredients);

    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');
  });

  it("분량은 기울임 태그가 아니라 일반 글자로 보여 준다", () => {
    expect(renderIngredients(sampleIngredients)).not.toContain("<i ");
  });

  it("추정 가격 재료에는 추정 태그가 붙는다", () => {
    expect(renderIngredients(sampleIngredients)).toContain("추정");
  });
});

describe("StepsPanel", () => {
  it("조리 순서가 없으면 안내하고 원문을 접어서 보여 준다", () => {
    const html = renderToStaticMarkup(
      <StepsPanel recipe={sampleAnalyzeData.recipe} ingredients={sampleIngredients} />,
    );

    expect(html).toContain("조리 순서가 정리되어 있지 않습니다");
    expect(html).toContain("<details");
    expect(html).toContain("설명란 원문 보기");
    expect(html).toContain("돼지고기 200g");
  });

  it("조리 순서가 있으면 번호와 함께 보여 준다", () => {
    const recipe = { ...sampleAnalyzeData.recipe, steps: ["재료를 썬다", "끓인다"], rawText: null };
    const html = renderToStaticMarkup(<StepsPanel recipe={recipe} ingredients={sampleIngredients} />);

    expect(html).toContain("재료를 썬다");
    expect(html).toContain("끓인다");
    expect(html).not.toContain("<details");
  });
});
