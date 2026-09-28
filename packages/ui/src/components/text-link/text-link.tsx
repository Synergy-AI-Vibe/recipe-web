import type { ComponentPropsWithRef, ElementType } from "react";
import { cn } from "../../lib/cn";

type TextLinkProps<T extends ElementType> = {
  /**
   * 렌더링할 요소. 기본값 `"a"`
   * - apps/web에서 화면 이동: `as={Link}` (next/link). ui 패키지는 next를 import하지 않으므로 이렇게 주입합니다.
   * - 이동이 아닌 동작: `as="button"` + `type="button"` + `onClick`
   * 넘긴 요소에 맞는 속성(`href`, `onClick` 등)을 그대로 받습니다.
   */
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithRef<T>, "as" | "className">;

/**
 * 글자 링크 (12.5px 회색, 호버 빨강). "← 돌아가기", "링크로 계산하기" 같은 보조 이동에 씁니다.
 * 위아래 투명 여백으로 클릭 영역 44px을 확보해 두었습니다.
 *
 * @example
 * <TextLink as={Link} href="/">← 돌아가기</TextLink>
 * <TextLink as="button" type="button" onClick={reset}>재료 다시 고르기</TextLink>
 */
export const TextLink = <T extends ElementType = "a">({
  as,
  className,
  ...props
}: TextLinkProps<T>) => {
  const Component: ElementType = as ?? "a";

  return (
    <Component
      className={cn(
        "inline-block py-3.25 text-c1 font-medium text-text-2 transition-colors duration-120 ease-linear hover:text-accent active:text-accent-press",
        className,
      )}
      {...props}
    />
  );
};
