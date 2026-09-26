"use client";

import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { StatusView } from "@/components/status-view";

const ErrorPage = ({ retry }: { error: Error & { digest?: string }; retry: () => void }) => {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <StatusView
      title="페이지를 불러오지 못했습니다"
      description="잠시 후 다시 시도해 주세요."
      action={
        <button
          type="button"
          onClick={() => {
            reset();
            retry();
          }}
          className="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          다시 시도
        </button>
      }
    />
  );
};

export default ErrorPage;
