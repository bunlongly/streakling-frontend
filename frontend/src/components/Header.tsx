// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';

type NavItem = {
  href: string;
  label: string;
  /** show only when signed-in */
  auth?: 'signed-in';
};

const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/profile/digitalcard', label: 'Explore Digital card' },
  { href: '/profile/portfolio', label: 'Explore Portfolio' },
  { href: '/challenges', label: 'Explore Challenges' }, // NEW
  { href: '/profiles', label: 'People' },
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
  { href: '/profile/challenges', label: 'My Challenges', auth: 'signed-in' }, // NEW
  {
    href: '/profile/challenges/create',
    label: 'Create Challenge',
    auth: 'signed-in'
  } // NEW
];

export default function Header() {
  const pathname = usePathname() || '/';
  const { isSignedIn } = useAuth();

  const visibleItems = navItems.filter(item =>
    item.auth === 'signed-in' ? isSignedIn : true
  );

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    // active for exact match or nested routes
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className='w-full border-b border-white/10 bg-surface/70 backdrop-blur sticky top-0 z-40'>
      <nav className='max-w-6xl mx-auto flex items-center justify-between px-6 h-14'>
        <Link
          href='/'
          className='font-bold text-lg text-[color:var(--color-primary)]'
        >
          Streakling
        </Link>

        <ul className='flex items-center gap-6 text-sm'>
          {visibleItems.map(item => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`hover:text-[color:var(--color-accent)] transition ${
                    active ? 'text-[color:var(--color-accent)] font-medium' : ''
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className='flex items-center gap-4'>
          {isSignedIn ? (
            <UserButton afterSignOutUrl='/' />
          ) : (
            <Link
              href='/sign-in'
              className='px-3 py-1.5 rounded-md bg-[color:var(--color-primary)] text-white text-sm font-medium hover:opacity-90'
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
