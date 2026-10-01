import { HeaderNav } from "@/components/layout/header/header-nav";
import { Logo } from "@/components/layout/header/logo";
import type { HeaderProps } from "@/components/layout/header/header.types";

export const Header = ({ user }: HeaderProps) => (
  <header className="border-b border-line">
    <div className="container flex flex-wrap items-center justify-between gap-4 py-5">
      <Logo />
      <HeaderNav user={user} />
    </div>
  </header>
);
