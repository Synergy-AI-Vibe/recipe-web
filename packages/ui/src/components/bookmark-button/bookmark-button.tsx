import { cn } from "../../lib/merge-class-names";
import type { BookmarkButtonProps } from "./bookmark-button.types";

export const BookmarkButton = ({
  active,
  label = "북마크",
  activeLabel = "북마크 됨",
  loading,
  savingLabel = "저장 중",
  removingLabel = "해제 중",
  disabled,
  className,
  ...props
}: BookmarkButtonProps) => {
  const loadingLabel = active ? removingLabel : savingLabel;
  const labels = [
    { key: "idle", text: label, visible: !loading && !active },
    { key: "active", text: activeLabel, visible: !loading && active },
    { key: "loading", text: loadingLabel, visible: Boolean(loading) },
  ];

  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-tap items-center justify-center border px-4.5 text-n1 font-medium whitespace-nowrap transition-colors duration-120 ease-linear disabled:cursor-default disabled:border-line disabled:bg-canvas disabled:text-text-3",
        active
          ? "border-text bg-text text-on-ink enabled:hover:border-ink-hover enabled:hover:bg-ink-hover enabled:active:border-ink-press enabled:active:bg-ink-press"
          : "border-line bg-surface text-text enabled:hover:border-text enabled:active:bg-canvas",
        className,
      )}
      {...props}
    >
      <span className="grid">
        {labels.map(({ key, text, visible }) => (
          <span key={key} className={cn("[grid-area:1/1]", !visible && "invisible")}>
            {text}
          </span>
        ))}
      </span>
    </button>
  );
};
