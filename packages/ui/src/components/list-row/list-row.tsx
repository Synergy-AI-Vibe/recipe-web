import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "../../lib/cn";

type ListProps = ComponentProps<"ul">;

/**
 * `ListRow`를 감싸는 목록. 위쪽에 검정 1px 선을 긋습니다.
 * 그 밖의 속성은 네이티브 `<ul>`과 같습니다.
 *
 * @example
 * <List>
 *   <ListRow title="돼지고기 김치찌개" ... />
 * </List>
 */
export const List = ({ className, ...props }: ListProps) => (
  <ul className={cn("border-t border-line-strong", className)} {...props} />
);

type ListRowProps = Omit<ComponentProps<"li">, "title"> & {
  /** 제목 (14.5px 굵게). 태그를 옆에 붙이려면 `<>제목 <Tag>…</Tag></>` */
  title: ReactNode;
  /** 제목 아래 부가정보 (12px 회색). 예: `"유튜브 · 자취요리연구소 · 2인분"` */
  meta?: ReactNode;
  /** 오른쪽 칸 내용. 오른쪽 정렬만 해 주므로 금액·보조 문구의 스타일은 호출하는 쪽에서 정합니다. */
  trailing?: ReactNode;
  /** 오른쪽 칸 최소 폭. 기본값 `96` (북마크), 추천 결과는 `104` */
  trailingWidth?: 96 | 104;
  /**
   * 행 전체를 눌렀을 때 이동할 주소. 주면 행이 링크가 됩니다. 화면 이동이면 `onOpen`보다 이쪽을 씁니다.
   * `href`와 `onOpen`을 둘 다 넘기면 `href`가 우선합니다.
   */
  href?: string;
  /** `href`를 쓸 때 렌더링할 링크 컴포넌트. apps/web에서는 `linkAs={Link}` (next/link). 기본값 `"a"` */
  linkAs?: ElementType;
  /** 행 전체를 눌렀을 때 실행할 함수. 주면 행이 버튼이 됩니다. `href`도 `onOpen`도 없으면 누를 수 없는 행입니다. */
  onOpen?: () => void;
  /** 삭제 × 버튼을 눌렀을 때 실행할 함수. 주면 ×가 나타납니다(북마크 전용). 눌러도 행 열기는 실행되지 않습니다. */
  onRemove?: () => void;
  /** × 버튼의 스크린리더용 이름. 기본값 `"삭제"`. 어떤 항목인지 담아 주세요. 예: `"돼지고기 김치찌개 삭제"` */
  removeLabel?: string;
};

// 열기 요소를 행 전체로 늘려 덮고, ×는 그 위에 쌓습니다. 버튼 안에 버튼을 넣지 않기 위한 구조입니다.
const OPEN_MARKER = "data-list-row-open";

/**
 * 목록 행. 북마크 목록과 재료로 찾기 추천 결과에서 씁니다. 반드시 `List` 안에 둡니다.
 * 행 전체가 클릭 대상이며(호버 회색), 삭제 ×는 그 위에 따로 눌리는 버튼입니다.
 *
 * @example
 * // 북마크 — 버튼으로 열기 + 삭제
 * <ListRow
 *   title="돼지고기 김치찌개"
 *   meta="유튜브 · 자취요리연구소 · 2인분"
 *   trailing={<b>12,850원</b>}
 *   onOpen={() => openBookmark(id)}
 *   onRemove={() => removeBookmark(id)}
 *   removeLabel="돼지고기 김치찌개 삭제"
 * />
 *
 * // 추천 결과 — 링크로 열기
 * <ListRow title="김치볶음밥" trailing={<b>추가 0원</b>} trailingWidth={104} href="/result?id=1" linkAs={Link} />
 */
export const ListRow = ({
  title,
  meta,
  trailing,
  trailingWidth = 96,
  href,
  linkAs,
  onOpen,
  onRemove,
  removeLabel = "삭제",
  className,
  ...props
}: ListRowProps) => {
  const isOpenable = href !== undefined || onOpen !== undefined;
  const OpenElement: ElementType = href !== undefined ? (linkAs ?? "a") : onOpen ? "button" : "div";

  return (
    <li
      className={cn(
        "relative flex flex-wrap items-center gap-4 border-b border-line py-4",
        isOpenable &&
          "hover:bg-canvas has-[[data-list-row-open]:active]:bg-line has-[[data-list-row-open]:focus-visible]:outline-2 has-[[data-list-row-open]:focus-visible]:-outline-offset-2 has-[[data-list-row-open]:focus-visible]:outline-focus",
        className,
      )}
      {...props}
    >
      <OpenElement
        {...(isOpenable && { [OPEN_MARKER]: "" })}
        {...(href !== undefined && { href })}
        {...(href === undefined && onOpen && { type: "button", onClick: onOpen })}
        className={cn(
          "min-w-42.5 flex-1 text-left",
          isOpenable && "cursor-pointer outline-none after:absolute after:inset-0",
        )}
      >
        <span className="block text-s2">{title}</span>
        {meta && <span className="block text-c2 text-text-2">{meta}</span>}
      </OpenElement>
      {trailing && (
        <div className={cn("text-right", trailingWidth === 104 ? "min-w-26" : "min-w-24")}>
          {trailing}
        </div>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className="relative z-1 flex size-7.5 flex-none items-center justify-center border border-line text-b2-bar font-normal text-text-2 after:absolute after:-inset-1.75 hover:border-line-strong hover:text-text active:bg-canvas"
        >
          ×
        </button>
      )}
    </li>
  );
};
