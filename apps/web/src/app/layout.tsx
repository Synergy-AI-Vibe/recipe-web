import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { LoginDialog } from "@/components/login-dialog";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

// theme.css의 --font-sans가 이 변수를 먼저 씁니다. 미리 받아 두고 대체 글꼴 크기를 맞춰 글꼴이 바뀔 때 화면이 흔들리지 않게 합니다
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  // weight를 생략하면 가변 글꼴 하나로 모든 굵기를 씁니다. 굵기별로 받으면 글꼴 선언과 파일이 4배가 됩니다
});

export const metadata: Metadata = {
  title: "레시비 — 유튜브 레시피 재료비 계산",
  description: "유튜브 레시피의 재료비를 계산해 사 먹을 때와 비교하는 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          {children}
          <Footer />
          <LoginDialog />
        </Providers>
      </body>
    </html>
  );
}
