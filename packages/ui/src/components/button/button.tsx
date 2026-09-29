import type { ComponentProps } from "react";
import { cn } from "../../lib/merge-class-names";

type ButtonVariant = "primary" | "accent" | "ghost" | "kakao";

type ButtonProps = Omit<ComponentProps<"button">, "type"> & {
  /**
   * 버튼 종류. 기본값 `"primary"`
   * - `primary`: 검정 주 버튼 (이 레시피로 계산, 레시피 찾기)
   * - `accent`: 빨강 주 버튼 (원가 계산, 탈퇴하기)
   * - `ghost`: 보조 버튼 (다른 링크 넣기, 취소). 글자색 기본 회색, 검정이 필요하면 `className="text-text"`
   * - `kakao`: 카카오 로그인. 폭 100%, 색·문구는 카카오 가이드라인 고정
   */
  variant?: ButtonVariant;
  /**
   * 버튼 동작. 기본값 `"button"` (HTML 기본값 `"submit"`과 다릅니다)
   * 폼을 제출해야 할 때만 `"submit"`을 넘깁니다. 예: 입력창 Enter와 같은 동작을 하는 계산 버튼
   */
  type?: "button" | "submit" | "reset";
  /**
   * 로딩 상태. `true`면 라벨이 `loadingLabel`로 바뀌고 비활성이 됩니다. 스피너는 없습니다.
   * - 로딩될 수 있는 버튼은 처음부터 `false`를 넘깁니다. 라벨 자리를 미리 잡아 두어 로딩이 시작돼도 폭이 흔들리지 않습니다.
   * - 로딩과 상관없는 버튼은 넘기지 않습니다(`undefined`).
   * - `undefined` → `true`로 바뀌면 폭이 흔들리므로 항상 boolean을 넘깁니다. 예: `mutation.isPending`
   */
  loading?: boolean;
  /** 로딩 중 보여 줄 라벨. 기본값 `"계산 중"` */
  loadingLabel?: string;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-text text-on-ink enabled:hover:bg-ink-hover enabled:active:bg-ink-press disabled:bg-canvas disabled:text-text-3",
  accent:
    "bg-accent text-on-ink focus-visible:outline-text enabled:hover:bg-accent-hover enabled:active:bg-accent-press disabled:bg-canvas disabled:text-text-3",
  ghost:
    "border border-line bg-surface font-medium text-text-2 enabled:hover:border-line-strong enabled:active:border-line-strong enabled:active:bg-canvas disabled:text-disabled",
  kakao:
    "w-full bg-kakao text-b2 text-text focus-visible:outline-text enabled:hover:bg-kakao-hover enabled:active:bg-kakao-press",
};

/**
 * 공용 버튼. 높이 44px, 반경 0, 호버·눌림·초점·비활성 색은 variant별로 디자인 시스템 값을 따릅니다.
 * 그 밖의 속성(`onClick`, `disabled`, `aria-*` 등)은 네이티브 `<button>`과 같습니다.
 * `className`은 기본 스타일보다 우선합니다. 예: 실패 카드 안 버튼 `className="text-[13.5px]"`
 *
 * @example
 * <Button onClick={retry}>이 레시피로 계산</Button>
 * <Button type="submit" variant="accent" loading={mutation.isPending}>원가 계산</Button>
 */
export const Button = ({
  variant = "primary",
  loading,
  loadingLabel = "계산 중",
  type = "button",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    // 높이를 44px로 고정합니다. padding으로 맞추면 className으로 글자 크기를 바꿀 때
    // tailwind-merge가 leading을 지워 높이가 달라집니다.
    className={cn(
      "inline-flex h-tap items-center justify-center px-6.5 text-b1b whitespace-nowrap transition-colors duration-120 ease-linear disabled:cursor-default",
      variantClassNames[variant],
      className,
    )}
    {...props}
  >
    {loading === undefined ? (
      children
    ) : (
      <span className="grid">
        <span className={cn("[grid-area:1/1]", loading && "invisible")}>{children}</span>
        <span className={cn("[grid-area:1/1]", !loading && "invisible")}>{loadingLabel}</span>
      </span>
    )}
  </button>
);
