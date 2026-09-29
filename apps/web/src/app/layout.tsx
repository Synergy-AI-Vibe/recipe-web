import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "레시비 — 유튜브 레시피 재료비 계산",
  description: "유튜브 레시피의 재료비를 계산해 사 먹을 때와 비교하는 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
