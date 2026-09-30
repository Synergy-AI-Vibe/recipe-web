export type HeaderProps = {
  user?: { name: string };
};

export type NavLink = {
  href: string;
  label: string;
  requiresAuth?: boolean;
};

export type AccountMenuProps = {
  name: string;
  onLogout: () => void;
  onWithdraw: () => void;
};
