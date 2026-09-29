import type { ComponentProps } from "react";
import { cn } from "../../lib/merge-class-names";

type TagTone = "neutral" | "caution" | "inverse";

type TagProps = ComponentProps<"span"> & {
  /**
   * 태그 색. 기본값 `"neutral"`
   * - `neutral`: 회색. 가격 출처(참가격·KAMIS·오픈마켓), 부족 N개
   * - `caution`: 연빨강. 금액 없음, 직접 입력
   * - `inverse`: 검정. 지금 바로 가능
   */
  tone?: TagTone;
};

const toneClassNames: Record<TagTone, string> = {
  neutral: "bg-canvas text-text-2 py-1",
  caution: "bg-accent-soft text-accent-strong py-1",
  inverse: "bg-text text-on-ink py-0.75",
};

/**
 * 작은 상태 태그 (11px). 재료 행의 가격 출처와 재료로 찾기 결과의 상태 표시에 씁니다.
 * 추천 결과의 "부족 N개"는 세로 여백이 1px 좁습니다: `className="py-0.75"`
 *
 * @example
 * <Tag>참가격</Tag>
 * <Tag tone="caution">금액 없음</Tag>
 * <Tag tone="inverse">지금 바로 가능</Tag>
 */
export const Tag =({ tone = "neutral", className, ...props }: TagProps) => (
  <span
    className={cn("inline-block px-2 text-l2", toneClassNames[tone], className)}
    {...props}
  />
);
