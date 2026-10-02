import { PANTRY_MAX_INGREDIENTS, PANTRY_MAX_NAME_LENGTH } from "@recipe-web/api";
import { Button, Chip, ChipAddInput, cn, TextLink } from "@recipe-web/ui";
import type { PantryPickerProps } from "@/components/pantry/pantry-picker.types";

export const PantryPicker = ({
  chosen,
  isFull,
  hint,
  popular,
  pending,
  onAdd,
  onRemove,
  onClear,
  onSubmit,
}: PantryPickerProps) => (
  <form onSubmit={onSubmit} className="mt-5.5">
    <div className="border border-line-strong px-4.5 py-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-l1-strong text-text-2">
          고른 재료 {chosen.length} / {PANTRY_MAX_INGREDIENTS}
        </p>
        {isFull && (
          <p className="text-l1-strong text-accent">{PANTRY_MAX_INGREDIENTS}개까지 고를 수 있습니다</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ChipAddInput
          label="가진 재료 직접 입력"
          maxLength={PANTRY_MAX_NAME_LENGTH}
          placeholder="재료 입력 후 Enter"
          disabled={isFull}
          onAdd={onAdd}
        />
        {chosen.length > 0 && (
          <ul aria-label="고른 재료" className="flex flex-wrap items-center gap-2">
            {chosen.map((label) => (
              <li key={label}>
                <Chip variant="selected" label={label} onRemove={() => onRemove(label)} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <p
        aria-live="polite"
        className={cn("mt-2.5 text-c1", hint.tone === "alert" ? "text-accent" : "text-text-2")}
      >
        {hint.text}
      </p>
    </div>

    <p id="pantry-popular-label" className="mt-4 mb-2.25 text-c1 text-text-2">
      자주 쓰는 재료
    </p>
    <ul aria-labelledby="pantry-popular-label" className="flex flex-wrap items-center gap-2">
      {popular.map((label) => (
        <li key={label}>
          <Chip variant="addable" label={label} disabled={isFull} onAdd={() => onAdd(label)} />
        </li>
      ))}
    </ul>

    <div className="mt-5.5 mb-8.5 flex flex-wrap items-center gap-3">
      <Button
        type="submit"
        loading={pending}
        loadingLabel="찾는 중"
        disabled={chosen.length === 0}
        className="px-7.5"
      >
        레시피 찾기
      </Button>
      {chosen.length > 0 && (
        <TextLink as="button" type="button" onClick={onClear}>
          모두 지우기
        </TextLink>
      )}
    </div>
  </form>
);
