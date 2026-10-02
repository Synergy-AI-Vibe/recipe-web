import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultPageContent } from "@/components/result/result-page-content";
import { ResultLoading } from "@/components/result/result-status";

export const metadata: Metadata = {
  title: "분석 결과 — 레시비",
  robots: { index: false, follow: false },
};

const ResultPage = () => (
  <main className="w-full flex-1">
    <Suspense fallback={<ResultLoading />}>
      <ResultPageContent />
    </Suspense>
  </main>
);

export default ResultPage;
