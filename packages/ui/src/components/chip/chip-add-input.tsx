"use client";

import { useState, type KeyboardEvent } from "react";
import { cn } from "../../lib/merge-class-names";
import type { ChipAddInputProps } from "./chip.types";

export const ChipAddInput = ({ label, onAdd, className, ...props }: ChipAddInputProps) => {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (event.nativeEvent.isComposing) return;
    submit();
  };

  return (
    <label
      className={cn(
        "inline-flex h-tap cursor-text items-center border border-line-strong bg-surface px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus has-disabled:cursor-default has-disabled:border-line has-disabled:bg-canvas",
        className,
      )}
    >
      <input
        type="text"
        autoComplete="off"
        aria-label={label}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        className="w-40 border-none bg-transparent p-0 text-n1 font-medium text-text outline-none placeholder:text-text-3 disabled:text-disabled disabled:placeholder:text-disabled"
        {...props}
      />
    </label>
  );
};
