import { getAmountText, getDisplayName } from "@/lib/ingredient-text";
import type { StepsPanelProps } from "@/components/result/steps-panel.types";

export const StepsPanel = ({ recipe, ingredients }: StepsPanelProps) => {
  const ingredientSummary = ingredients
    .map((ingredient) => {
      const amount = getAmountText(ingredient);
      const name = getDisplayName(ingredient);
      return amount ? `${name} ${amount}` : name;
    })
    .join(" · ");

  return (
    <>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-h5">조리법</h2>
        <span className="text-c1 text-text-2">
          {recipe.sourceType === "youtube" ? "설명란 원문 요약" : "직접 입력한 레시피"}
        </span>
      </div>
      <p className="mb-5.5 text-b4 text-text-2">{recipe.servings}인분</p>

      <div className="mb-7 border border-line px-5 py-4.5">
        <p className="mb-2.5 text-l1-strong text-text-2">재료</p>
        <p className="text-b1 text-text">{ingredientSummary}</p>
      </div>

      {recipe.steps.length > 0 ? (
        <ol className="border-t border-line-strong">
          {recipe.steps.map((step, index) => (
            <li key={step} className="flex flex-wrap gap-4.5 border-b border-line py-4.5">
              <span className="w-6.5 flex-none text-b2-bar text-accent">{index + 1}</span>
              <p className="min-w-50 flex-1 text-b1">{step}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-b3 text-text-2">이 레시피는 조리 순서가 정리되어 있지 않습니다.</p>
      )}

      {recipe.rawText && (
        <details className="mt-5">
          <summary className="cursor-pointer text-c1 font-bold text-text-2 hover:text-text">
            {recipe.sourceType === "youtube" ? "설명란 원문 보기" : "입력한 원문 보기"}
          </summary>
          <pre className="mt-3.5 max-w-[70ch] font-sans text-b3 whitespace-pre-line text-text-2">
            {recipe.rawText}
          </pre>
        </details>
      )}
    </>
  );
};
