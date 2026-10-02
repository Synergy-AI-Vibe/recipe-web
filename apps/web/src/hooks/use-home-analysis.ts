import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AnalyzeResponse } from "@recipe-web/api";
import type {
  InputError,
  InputMode,
} from "@/components/home/recipe-input";
import { isYoutubeUrl } from "@/lib/is-youtube-url";
import { useAnalyzeRecipe } from "@/queries/analyze";
import { useResultStore } from "@/store/result-store";
import type { ResultSource } from "@/types/result";

export const useHomeAnalysis = () => {
  const router = useRouter();
  const openResult = useResultStore((state) => state.open);
  const [mode, setMode] = useState<InputMode>("youtube");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [recoveryText, setRecoveryText] = useState("");
  const [inputError, setInputError] = useState<InputError>(null);
  const [recoveryError, setRecoveryError] = useState(false);
  const analyze = useAnalyzeRecipe();

  const goToResult = (source: ResultSource) => (response: AnalyzeResponse) => {
    if (response.status !== "success") return;
    openResult(source, response.data);
    router.push("/result");
  };

  const resetAll = () => {
    setMode("youtube");
    setUrl("");
    setText("");
    setRecoveryText("");
    setInputError(null);
    setRecoveryError(false);
    analyze.reset();
  };

  const switchMode = (nextMode: InputMode) => {
    setMode(nextMode);
    setInputError(null);
    analyze.reset();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (analyze.isPending) return;

    if (mode === "youtube") {
      if (!isYoutubeUrl(url)) {
        setInputError("youtube");
        return;
      }
      setInputError(null);
      const source: ResultSource = { type: "youtube", url: url.trim() };
      analyze.mutate({ type: "youtube", url: source.url }, { onSuccess: goToResult(source) });
      return;
    }

    if (!text.trim()) {
      setInputError("text");
      return;
    }
    setInputError(null);
    const source: ResultSource = { type: "text", text: text.trim() };
    analyze.mutate({ type: "text", text: source.text }, { onSuccess: goToResult(source) });
  };

  const submitRecovery = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (analyze.isPending) return;
    if (!recoveryText.trim()) {
      setRecoveryError(true);
      return;
    }
    setRecoveryError(false);
    setMode("text");
    setText(recoveryText);
    const source: ResultSource = { type: "text", text: recoveryText.trim() };
    analyze.mutate({ type: "text", text: source.text }, { onSuccess: goToResult(source) });
  };

  const pending = analyze.isPending || analyze.data?.status === "success";

  return {
    pending,
    showOutcome: !pending && (analyze.data !== undefined || analyze.isError),
    input: {
      mode,
      url,
      text,
      error: inputError,
      pending,
      onModeChange: switchMode,
      onUrlChange: (value: string) => {
        setUrl(value);
        setInputError(null);
      },
      onTextChange: (value: string) => {
        setText(value);
        setInputError(null);
      },
      onSubmit: submit,
    },
    outcome: {
      response: analyze.data,
      error: analyze.error,
      recoveryText,
      recoveryError,
      pending,
      onRecoveryTextChange: (value: string) => {
        setRecoveryText(value);
        setRecoveryError(false);
      },
      onRecoverySubmit: submitRecovery,
      onReset: resetAll,
    },
  };
};
