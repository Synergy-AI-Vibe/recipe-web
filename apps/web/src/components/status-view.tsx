import type { ReactNode } from "react";

type StatusViewProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export const StatusView = ({ title, description, action }: StatusViewProps) => (
  <main className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
    <h1 className="text-2xl font-semibold">{title}</h1>
    <p className="max-w-md text-zinc-600 dark:text-zinc-400">{description}</p>
    {action}
  </main>
);
