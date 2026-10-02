import Link from "next/link";
import { TextLink } from "@recipe-web/ui";
import type { ResultHeaderProps } from "@/components/result/result-header.types";

export const ResultHeader = ({ recipe, ingredientCount, action }: ResultHeaderProps) => (
  <section className="container pt-section-input pb-7">
    <p className="mb-1.75 text-l1 text-text-2">
      {recipe.sourceType === "youtube"
        ? `유튜브${recipe.channelName ? ` · ${recipe.channelName}` : ""}`
        : "직접 입력"}
    </p>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-h2">{recipe.title}</h1>
        <p className="mt-1 text-b4 text-text-2">
          {recipe.servings}인분 · 재료 {ingredientCount}개
        </p>
      </div>
      {action}
    </div>
    <TextLink as={Link} href="/">
      다른 레시피 넣기
    </TextLink>
  </section>
);
