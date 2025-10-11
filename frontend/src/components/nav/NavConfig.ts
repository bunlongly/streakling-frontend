// Route config only (no React here)
export type NavItem = { href: string; label: string; auth?: 'signed-in' };

/** Centered menu row items (public) */
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

export const DEFAULT_SECTION_TABS: { href: string; label: string }[] = [
  { href: '/profile', label: 'Overview' },
  { href: '/profile/cards', label: 'Cards' },
  { href: '/profile/portfolios', label: 'Portfolios' },
  { href: '/profile/submissions', label: 'Submissions' }
];
