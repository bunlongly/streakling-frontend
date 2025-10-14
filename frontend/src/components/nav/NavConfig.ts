// Route config only (no React here)

export type Role = 'ADMIN' | 'USER' | undefined;

export type NavItem = {
  href: string;
  label: string;
  /** show only when signed in (any role) */
  auth?: 'signed-in';
  /** show only for admins (also requires signed in) */
  admin?: true;
};

/** Public, centered menu row */
export const PUBLIC_PRIMARY: NavItem[] = [
  { href: '/profiles', label: 'Creators' },
  { href: '/profile/digitalcard', label: 'Digital Card' },
  { href: '/profile/portfolio', label: 'Portfolio' },
  { href: '/challenges', label: 'Challenges' }
];

/** Appends to the menu row only when signed in */
export const AUTHED_PRIMARY: NavItem[] = [
  { href: '/profile', label: 'My Profile', auth: 'signed-in' }
];

/** Admin-only items to append to the primary row (kept short) */
export const ADMIN_PRIMARY: NavItem[] = [
  { href: '/admin', label: 'Admin', auth: 'signed-in', admin: true }
];

/** Extra signed-in links (appear in the sidebar) */
export const AUTHED_SECONDARY: NavItem[] = [
  { href: '/profile/cards', label: 'My Cards', auth: 'signed-in' },
  { href: '/profile/cards/create', label: 'Create Card', auth: 'signed-in' },
  { href: '/profile/portfolios', label: 'My Portfolios', auth: 'signed-in' },
  {
    href: '/profile/portfolios/create',
    label: 'Create Portfolio',
    auth: 'signed-in'
  },
  { href: '/profile/challenges', label: 'My Challenges', auth: 'signed-in' },
  {
    href: '/profile/challenges/create',
    label: 'Create Challenge',
    auth: 'signed-in'
  },
  { href: '/profile/submissions', label: 'My Submissions', auth: 'signed-in' }
];

/** Optional: admin management links for the sidebar */
export const ADMIN_SECONDARY: NavItem[] = [
  { href: '/admin', label: 'Dashboard', auth: 'signed-in', admin: true },
  { href: '/admin/users', label: 'Users', auth: 'signed-in', admin: true },
  {
    href: '/admin/challenges',
    label: 'Challenges',
    auth: 'signed-in',
    admin: true
  },
  {
    href: '/admin/cards',
    label: 'Digital Cards',
    auth: 'signed-in',
    admin: true
  },
  {
    href: '/admin/portfolios',
    label: 'Portfolios',
    auth: 'signed-in',
    admin: true
  }
];

export const DEFAULT_SECTION_TABS: { href: string; label: string }[] = [
  { href: '/profile', label: 'Overview' },
  { href: '/profile/cards', label: 'Cards' },
  { href: '/profile/portfolios', label: 'Portfolios' },
  { href: '/profile/submissions', label: 'Submissions' }
];

/* ========================= Helpers ========================= */

export function filterNav(
  items: NavItem[],
  opts: { signedIn: boolean; role: Role }
) {
  return items.filter(it => {
    if (it.admin) return opts.signedIn && opts.role === 'ADMIN';
    if (it.auth === 'signed-in') return opts.signedIn;
    return true; // public
  });
}

/** Build the primary (top row) menu */
export function buildPrimaryNav(opts: { signedIn: boolean; role: Role }) {
  const base = [...PUBLIC_PRIMARY];
  if (opts.signedIn) base.push(...AUTHED_PRIMARY);
  if (opts.role === 'ADMIN') base.push(...ADMIN_PRIMARY);
  return filterNav(base, opts);
}

/** Build the sidebar menu */
export function buildSidebarNav(opts: { signedIn: boolean; role: Role }) {
  const base = [...AUTHED_SECONDARY];
  if (opts.role === 'ADMIN') base.push(...ADMIN_SECONDARY);
  return filterNav(base, opts);
}
