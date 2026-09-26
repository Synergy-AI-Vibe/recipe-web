import Link from "next/link";
import { StatusView } from "@/components/status-view";

//NOTE: UI 점검 필요
const NotFound = () => (
  <StatusView
    title="페이지를 찾을 수 없습니다"
    description="주소를 확인하거나 홈에서 다시 찾아주세요."
    action={
      <Link
        href="/"
        className="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        홈으로 이동
      </Link>
    }
  />
);

export default NotFound;
