import { cn } from "../../lib/merge-class-names";
import type { ChipProps } from "./chip.types";

export const Chip = (props: ChipProps) => {
  if (props.variant === "selected") {
    const { label, onRemove, removeLabel = `${label} 빼기`, className } = props;
    return (
      <span
        className={cn(
          "inline-flex h-tap items-center border border-text bg-text pl-3 text-n1 font-medium text-on-ink",
          className,
        )}
      >
        {label}
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className="flex h-tap w-9 items-center justify-center text-chip-mark transition-colors duration-120 ease-linear hover:text-on-ink focus-visible:outline-on-ink"
        >
          <span aria-hidden>×</span>
        </button>
      </span>
    );
  }

  const { label, onAdd, disabled, className } = props;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAdd}
      className={cn(
        "inline-flex h-tap items-center gap-2 border border-line bg-surface px-3 text-n1 font-medium text-text transition-colors duration-120 ease-linear enabled:hover:border-text enabled:active:bg-canvas disabled:cursor-default disabled:border-line disabled:bg-canvas disabled:text-disabled",
        className,
      )}
    >
      <span aria-hidden>＋</span>
      {label}
    </button>
  );
};
