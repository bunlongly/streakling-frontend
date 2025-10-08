// Route config only (no React here)
export type NavItem = { href: string; label: string; auth?: 'signed-in' };

export const PUBLIC_ITEMS: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/profile/digitalcard', label: 'Explore Digital card' },
  { href: '/profile/portfolio', label: 'Explore Portfolio' },
  { href: '/challenges', label: 'Explore Challenges' },
  { href: '/profiles', label: 'People' }
];

export const AUTHED_ITEMS: NavItem[] = [
  { href: '/profile', label: 'My Profile', auth: 'signed-in' },
  { href: '/profile/cards', label: 'My Cards', auth: 'signed-in' },
  { href: '/profile/cards/create', label: 'Create Card', auth: 'signed-in' },
  { href: '/profile/portfolios', label: 'My Portfolios', auth: 'signed-in' },
  { href: '/profile/submissions', label: 'My Submissions', auth: 'signed-in' },
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
  }
];

export const DEFAULT_SECTION_TABS: { href: string; label: string }[] = [
  { href: '/profile', label: 'Overview' },
  { href: '/profile/cards', label: 'Cards' },
  { href: '/profile/portfolios', label: 'Portfolios' },
  { href: '/profile/submissions', label: 'Submissions' }
];
