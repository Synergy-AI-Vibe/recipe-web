import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/merge-class-names";

type NoticeCardProps = Omit<ComponentProps<"section">, "title"> & {
  /**
   * 카드 종류. 기본값 `"alert"`
   * - `alert`: 검정 테두리, 넓은 여백. 추출 실패·결과 없음처럼 결과 영역을 대신하는 안내
   * - `quiet`: 연회색 테두리, 좁은 여백. "김치찌개 2인 18,000 ~ 24,000원" 같은 조용한 정보
   */
  variant?: "alert" | "quiet";
  /** 제목 위 작은 빨강 라벨. 예: `"추출 실패"` */
  eyebrow?: string;
  /**
   * 제목 (20px). 예: `"설명란에서 재료를 찾지 못했어요"`
   * 문서 제목이 필요한 자리면 태그째 넘깁니다: `title={<h2>…</h2>}` (모습은 같습니다)
   */
  title?: ReactNode;
  /** 본문 (13.5px 회색, 최대 56자 폭). 문자열 안의 `\n`은 줄바꿈으로 보입니다. */
  description?: ReactNode;
  /** 맨 아래 버튼 묶음. 카드 안 버튼은 `className="text-[13.5px]"`를 붙입니다. */
  actions?: ReactNode;
};

/**
 * 안내 카드. 추출 실패(h4), 재료로 찾기 결과 없음(p3), 결과 화면의 기준 가격에 씁니다.
 * 결과 영역을 **대신해서** 그립니다. 결과 위에 겹쳐 띄우지 않습니다.
 * eyebrow → title → description → children → actions 순서로 그리며, 정해진 틀이 없는 내용은 `children`으로 넣습니다.
 *
 * @example
 * <NoticeCard
 *   eyebrow="추출 실패"
 *   title="설명란에서 재료를 찾지 못했어요"
 *   description="이 영상은 설명란에 재료 목록이 없습니다."
 *   actions={<Button className="text-[13.5px]">이 레시피로 계산</Button>}
 * />
 *
 * <NoticeCard variant="quiet">김치찌개 2인 · 18,000 ~ 24,000원</NoticeCard>
 */
export const NoticeCard = ({
  variant = "alert",
  eyebrow,
  title,
  description,
  actions,
  className,
  children,
  ...props
}: NoticeCardProps) => (
  <section
    className={cn(
      "border",
      variant === "alert"
        ? "border-line-strong p-[clamp(24px,4vw,32px)]"
        : "border-line px-5 py-4.5",
      className,
    )}
    {...props}
  >
    {eyebrow && <p className="mb-3 text-l1-strong text-accent">{eyebrow}</p>}
    {title && <div className="mb-2 text-h4">{title}</div>}
    {description && (
      <p className="max-w-[56ch] whitespace-pre-line text-b3 text-text-2">{description}</p>
    )}
    {children}
    {actions && <div className="mt-5.5 flex flex-wrap gap-2.5">{actions}</div>}
  </section>
);
