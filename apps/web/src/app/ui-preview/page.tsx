import type { Metadata } from "next";
import { UiPreview } from "@/components/ui-preview/ui-preview";

// 공용 컴포넌트 확인용 임시 페이지
export const metadata: Metadata = {
  title: "공용 컴포넌트 미리보기",
  robots: { index: false, follow: false },
};

const UiPreviewPage = () => <UiPreview />;

export default UiPreviewPage;
