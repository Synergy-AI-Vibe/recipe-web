import type { FormEvent } from "react";
import type { AnalyzeResponse } from "@recipe-web/api";
import { Button, NoticeCard } from "@recipe-web/ui";
import { RecoveryForm } from "@/components/home/recovery-form";

type AnalysisOutcomeProps = {
  response?: AnalyzeResponse;
  error: Error | null;
  recoveryText: string;
  recoveryError: boolean;
  pending: boolean;
  onRecoveryTextChange: (value: string) => void;
  onRecoverySubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

export const AnalysisOutcome = ({
  response,
  error,
  recoveryText,
  recoveryError,
  pending,
  onRecoveryTextChange,
  onRecoverySubmit,
  onReset,
}: AnalysisOutcomeProps) => (
  <div className="pt-8">
    {response?.status === "no_recipe_found" && (
      <NoticeCard
        eyebrow="추출 실패"
        title={<h1>설명란에서 재료를 찾지 못했어요</h1>}
        description="이 영상은 설명란에 재료 목록이 없습니다. 재료를 직접 적어 주시면 같은 방식으로 계산해 드립니다."
      >
        <RecoveryForm
          value={recoveryText}
          error={recoveryError}
          pending={pending}
          onChange={onRecoveryTextChange}
          onSubmit={onRecoverySubmit}
          onReset={onReset}
        />
      </NoticeCard>
    )}
    {(error || response?.status === "error") && (
      <NoticeCard
        eyebrow="계산 실패"
        title={<h1>계산을 완료하지 못했어요</h1>}
        description={error?.message ?? (response?.status === "error" ? response.message : "계산에 실패했습니다.")}
        actions={
          <Button variant="ghost" onClick={onReset} className="text-b3">
            다시 입력하기
          </Button>
        }
      />
    )}
    {response?.status === "success" && (
      <NoticeCard
        variant="quiet"
        title={<h1>{response.data.recipe.title}</h1>}
        description={`재료 ${response.data.ingredients.length}개의 가격을 계산했습니다.`}
        actions={
          <Button variant="ghost" onClick={onReset} className="text-b3">
            다른 레시피 넣기
          </Button>
        }
      />
    )}
  </div>
);
