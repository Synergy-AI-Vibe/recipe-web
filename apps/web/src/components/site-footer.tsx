import Link from "next/link";

export const SiteFooter = () => (
  <footer className="border-t border-line bg-surface">
    <div className="container flex flex-wrap justify-between gap-x-8 gap-y-5 py-7">
      <Link href="/" className="text-s1 text-text" aria-label="레시비 홈">
        레시비
      </Link>
      <p className="max-w-100 min-w-60 flex-1 text-f1 text-text-2">
        가격은 KAMIS · 참가격 공공 API 기준이며, 매장가는 조회 시점에 따라 실제와 다를 수 있습니다.
      </p>
    </div>
  </footer>
);
