import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

type BannerProps = ComponentProps<"div">;

/**
 * 경고 배너 (빨강 테두리 + 연빨강 바탕). 가격 없는 재료 안내, 북마크 5개 가득 안내에 씁니다.
 * - 닫기 버튼이 없습니다. 조건이 참인 동안 호출하는 쪽이 렌더링하고, 조건이 풀리면 렌더링하지 않습니다.
 * - 강조할 단어는 `<b>`로 감쌉니다.
 * 그 밖의 속성은 네이티브 `<div>`와 같습니다.
 *
 * @example
 * {hasMissingPrice && (
 *   <Banner><b>사골육수 팩</b>은 가격 데이터가 없습니다. 아래에서 금액을 넣으면 합계에 바로 반영됩니다.</Banner>
 * )}
 */
export const Banner = ({ className, ...props }: BannerProps) => (
  <div
    role="status"
    className={cn(
      "border border-accent bg-accent-soft px-4 py-3.5 text-c1 text-text [&_b]:font-bold [&_strong]:font-bold",
      className,
    )}
    {...props}
  />
);
