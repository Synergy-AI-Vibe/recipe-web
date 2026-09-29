import type { ComponentProps } from "react";
import { cn } from "../../lib/merge-class-names";

type SkeletonProps = ComponentProps<"div">;

/**
 * 로딩 자리표시 (회색 사각형, 애니메이션 없음). 스피너 대신 실제 요소가 올 자리에 둡니다.
 * - 크기는 `className`으로 지정합니다. 예: `className="h-4 w-2/5"`
 * - 스크린리더에는 숨겨집니다. 로딩 중인 영역을 감싼 요소에 `aria-busy`를 두세요.
 * - 행 모양(재료 행 9개, 북마크 행 4개 등)은 각 화면에서 이 부품을 조합해 만듭니다.
 *
 * @example
 * <ul aria-busy>
 *   <li><Skeleton className="h-4 w-2/5" /></li>
 * </ul>
 */
export const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div aria-hidden className={cn("block bg-canvas", className)} {...props} />
);
