import type { FormEvent } from "react";
import { Button } from "@recipe-web/ui";
import { isYoutubeUrl } from "@/lib/is-youtube-url";

export type InputMode = "youtube" | "text";
export type InputError = InputMode | null;

type RecipeInputProps = {
  mode: InputMode;
  url: string;
  text: string;
  error: InputError;
  pending: boolean;
  onModeChange: (mode: InputMode) => void;
  onUrlChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const RecipeInput = ({
  mode,
  url,
  text,
  error,
  pending,
  onModeChange,
  onUrlChange,
  onTextChange,
  onSubmit,
}: RecipeInputProps) => {
  const youtubeLabel = url.trim() && !error && isYoutubeUrl(url);

  return (
    <section aria-label="레시피 입력">
      <div className="mb-4 flex gap-6">
        <button
          type="button"
          aria-pressed={mode === "youtube"}
          onClick={() => onModeChange("youtube")}
          disabled={pending}
          className={`min-h-11 border-b-2 text-b1b ${mode === "youtube" ? "border-line-strong text-text" : "border-transparent text-text-3"}`}
        >
          YouTube 링크
        </button>
        <button
          type="button"
          aria-pressed={mode === "text"}
          onClick={() => onModeChange("text")}
          disabled={pending}
          className={`min-h-11 border-b-2 text-b1b ${mode === "text" ? "border-line-strong text-text" : "border-transparent text-text-3"}`}
        >
          레시피 직접 입력
        </button>
      </div>

      <form onSubmit={onSubmit} noValidate>
        {mode === "youtube" ? (
          <>
            <div
              className={`flex min-h-15 items-center gap-2 border p-1.5 ${error === "youtube" ? "border-accent" : "border-line-strong"}`}
            >
              {youtubeLabel && <span className="pl-3 text-l1 text-text-2">YOUTUBE</span>}
              <label htmlFor="youtube-url" className="sr-only">
                YouTube 주소
              </label>
              <input
                id="youtube-url"
                type="text"
                inputMode="url"
                value={url}
                onChange={(event) => onUrlChange(event.target.value)}
                disabled={pending}
                aria-invalid={error === "youtube"}
                aria-describedby="youtube-help"
                placeholder="https://youtu.be/... 또는 youtube.com/watch?v=..."
                className="min-w-0 flex-1 px-3 text-b1 text-text outline-offset-2 placeholder:text-text-3"
              />
              <Button
                type="submit"
                variant="accent"
                loading={pending}
                className={error === "youtube" ? "bg-canvas text-text-3 enabled:hover:bg-canvas" : undefined}
              >
                원가 계산
              </Button>
            </div>
            <p
              id="youtube-help"
              className={`mt-3 text-b4 ${error === "youtube" ? "text-accent" : "text-text-2"}`}
              role={error === "youtube" ? "alert" : undefined}
            >
              {error === "youtube" ? (
                <>
                  유튜브 주소만 계산할 수 있습니다.
                  <br />
                  youtube.com 또는 youtu.be 링크를 넣어 주세요.
                </>
              ) : (
                <>
                  유튜브 영상 설명란에서 재료를 읽습니다.
                  <br />
                  블로그·인스타 링크는 아직 지원하지 않습니다.
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <div className={`border p-2 ${error === "text" ? "border-accent" : "border-line-strong"}`}>
              <label htmlFor="recipe-text" className="sr-only">
                레시피 직접 입력
              </label>
              <textarea
                id="recipe-text"
                value={text}
                onChange={(event) => onTextChange(event.target.value)}
                disabled={pending}
                aria-invalid={error === "text"}
                aria-describedby="text-help"
                placeholder={"돼지고기 300g\n신김치 400g\n두부 1모\n\n레시피 본문을 통째로 붙여 넣어도 됩니다."}
                className="min-h-45 w-full p-3 text-b1 text-text outline-offset-2 placeholder:text-text-3"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-2 pt-3">
                <p className="text-b4 text-text-2">
                  한 줄에 재료 하나 · 인사말이나 타임스탬프는 알아서 걸러냅니다
                </p>
                <Button
                  type="submit"
                  loading={pending}
                  className={error === "text" ? "bg-canvas text-text-3 enabled:hover:bg-canvas" : undefined}
                >
                  이 레시피로 계산
                </Button>
              </div>
            </div>
            <p
              id="text-help"
              className={`mt-3 text-b4 ${error === "text" ? "text-accent" : "text-text-2"}`}
              role={error === "text" ? "alert" : undefined}
            >
              {error === "text" ? (
                <>
                  적은 재료가 없습니다.
                  <br />
                  한 줄에 하나씩 적고 다시 눌러 주세요.
                </>
              ) : (
                "'한 줌 · 적당량' 같은 표현은 평균값으로 바꿔 계산하고, 아래 재료별 금액에서 고칠 수 있습니다."
              )}
            </p>
          </>
        )}
      </form>
    </section>
  );
};
