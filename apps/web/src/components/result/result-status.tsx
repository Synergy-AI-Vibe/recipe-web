import { Button, NoticeCard, Skeleton } from "@recipe-web/ui";
import type { ResultFailedProps } from "@/components/result/result-status.types";

export const ResultLoading = () => (
  <div className="container flex flex-col gap-3 pt-section-auth pb-section-end" aria-busy>
    <p className="sr-only" role="status">
      결과를 불러오는 중입니다
    </p>
    <Skeleton className="h-16" />
    <Skeleton className="h-50" />
    <Skeleton className="h-4 w-3/5" />
  </div>
);

export const ResultFailed = ({ onGoHome }: ResultFailedProps) => (
  <div className="container pt-section-auth pb-section-end">
    <NoticeCard
      eyebrow="계산 실패"
      title={<h1>다시 불러오지 못했습니다</h1>}
      description={"이 레시피를 다시 계산하지 못했습니다.\n홈에서 링크를 다시 넣어주세요."}
      actions={
        <Button variant="ghost" className="text-b3" onClick={onGoHome}>
          홈으로
        </Button>
      }
    />
  </div>
);
