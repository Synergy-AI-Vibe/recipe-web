import type { Metadata } from "next";
import { ResultPreview } from "@/components/result/result-preview";

export const metadata: Metadata = {
  title: "결과 화면 미리보기",
  robots: { index: false, follow: false },
};

const ResultPreviewPage = () => (
  <main className="w-full flex-1">
    <ResultPreview />
  </main>
);

export default ResultPreviewPage;
