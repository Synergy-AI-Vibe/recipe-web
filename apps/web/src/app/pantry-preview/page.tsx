import type { Metadata } from "next";
import { PantryPreview } from "@/components/pantry/pantry-preview";

export const metadata: Metadata = {
  title: "있는 재료로 찾기 미리보기",
  robots: { index: false, follow: false },
};

const PantryPreviewPage = () => (
  <main className="container w-full flex-1 pb-section-end pt-section-page">
    <h1 className="mb-6 text-h3 text-text">있는 재료로 찾기 결과 미리보기</h1>
    <PantryPreview />
  </main>
);

export default PantryPreviewPage;
