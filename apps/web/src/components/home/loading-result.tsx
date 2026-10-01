import { Skeleton } from "@recipe-web/ui";

export const LoadingResult = () => (
  <section aria-label="계산 대기" aria-busy="true" className="mt-18 space-y-14">
    <span className="sr-only">재료와 가격을 계산하는 중입니다.</span>
    <div className="space-y-3 border-b border-line pb-5">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-5 pt-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-20 w-2/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  </section>
);
