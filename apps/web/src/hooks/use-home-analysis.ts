import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { analyzeRecipe, type AnalyzeRequest } from "@recipe-web/api";
import type {
  InputError,
  InputMode,
} from "@/components/home/recipe-input";
import { getApiClient } from "@/lib/api-client";
import { isYoutubeUrl } from "@/lib/is-youtube-url";

export const useHomeAnalysis = () => {
  const [mode, setMode] = useState<InputMode>("youtube");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [recoveryText, setRecoveryText] = useState("");
  const [inputError, setInputError] = useState<InputError>(null);
  const [recoveryError, setRecoveryError] = useState(false);
  const analyze = useMutation({
    mutationFn: (input: AnalyzeRequest) => analyzeRecipe(getApiClient(), input),
    meta: { errorMode: "local" },
  });

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
      analyze.mutate({ type: "youtube", url: url.trim() });
      return;
    }

    if (!text.trim()) {
      setInputError("text");
      return;
    }
    setInputError(null);
    analyze.mutate({ type: "text", text: text.trim() });
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
    analyze.mutate({ type: "text", text: recoveryText.trim() });
  };

  return {
    pending: analyze.isPending,
    showOutcome:
      !analyze.isPending && (analyze.data !== undefined || analyze.isError),
    input: {
      mode,
      url,
      text,
      error: inputError,
      pending: analyze.isPending,
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
      pending: analyze.isPending,
      onRecoveryTextChange: (value: string) => {
        setRecoveryText(value);
        setRecoveryError(false);
      },
      onRecoverySubmit: submitRecovery,
      onReset: resetAll,
    },
  };
};
