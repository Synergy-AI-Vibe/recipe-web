import type { FormEvent } from "react";
import { Button } from "@recipe-web/ui";

type RecoveryFormProps = {
  value: string;
  error: boolean;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

export const RecoveryForm = ({
  value,
  error,
  pending,
  onChange,
  onSubmit,
  onReset,
}: RecoveryFormProps) => (
  <form onSubmit={onSubmit} className="mt-6">
    <label htmlFor="recovery-recipe" className="sr-only">
      재료 직접 입력
    </label>
    <textarea
      id="recovery-recipe"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={error}
      aria-describedby={error ? "recovery-error" : undefined}
      placeholder={"돼지고기 300g\n신김치 400g\n두부 1모"}
      className={`min-h-28 w-full border p-4 text-b1 outline-offset-2 placeholder:text-text-3 ${error ? "border-accent" : "border-line-2"}`}
    />
    {error && (
      <p id="recovery-error" role="alert" className="mt-2 text-b3 text-accent">
        적은 재료가 없습니다. 한 줄에 하나씩 적고 다시 눌러 주세요.
      </p>
    )}
    <div className="mt-3 flex flex-wrap gap-2.5">
      <Button type="submit" loading={pending} className="text-b3">
        이 레시피로 계산
      </Button>
      <Button variant="ghost" onClick={onReset} className="text-b3">
        다른 링크 넣기
      </Button>
    </div>
  </form>
);
