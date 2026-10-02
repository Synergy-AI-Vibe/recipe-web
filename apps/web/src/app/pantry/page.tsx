import type { Metadata } from "next";
import { PantryContent } from "@/components/pantry/pantry-content";

export const metadata: Metadata = {
  title: "있는 재료로 찾기 — 레시비",
  description: "가진 재료로 만들 수 있는 레시피를 추가로 사야 하는 금액 순으로 보여줍니다",
};

const PantryPage = () => (
  <main className="container w-full flex-1 pb-section-end pt-section-page">
    <h1 className="text-h3 text-text">있는 재료로 찾기</h1>
    <p className="mt-2 text-b1 text-text-2">
      가진 재료를 최대 5개까지 고르고 찾기를 누르면,
      <br />
      그걸로 만들 수 있는 레시피를 추가로 사야 하는 금액 순으로 보여줍니다.
    </p>
    <PantryContent />
  </main>
);

export default PantryPage;
