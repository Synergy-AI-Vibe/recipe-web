import { cn } from "../../lib/merge-class-names";
import type { PriceInputProps } from "./price-input.types";

const MAX_DIGITS = 9;

export const PriceInput = ({
  label,
  value,
  onValueChange,
  unit = "원",
  className,
  ...props
}: PriceInputProps) => (
  <label
    className={cn(
      "inline-flex min-h-tap cursor-text items-center gap-1.5 border border-accent px-2.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus",
      className,
    )}
  >
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="0"
      aria-label={label}
      value={value > 0 ? String(value) : ""}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS);
        onValueChange(digits ? Number(digits) : 0);
      }}
      className="w-15 border-none bg-transparent p-0 text-right text-b2 text-text outline-none placeholder:font-normal placeholder:text-text-3"
      {...props}
    />
    <span className="text-c2 text-text-2">{unit}</span>
  </label>
);
