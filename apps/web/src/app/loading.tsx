const Loading = () => (
  <main
    role="status"
    aria-live="polite"
    className="flex min-h-[60vh] flex-1 items-center justify-center px-6"
  >
    <span className="sr-only">페이지를 불러오는 중입니다.</span>
    <div aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white" />
  </main>
);

export default Loading;
