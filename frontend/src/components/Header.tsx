// src/components/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import ThemeToggle from '@/components/theme/ThemeToggle';

type NavItem = { href: string; label: string; auth?: 'signed-in' };

const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/profile/digitalcard', label: 'Explore Digital card' },
  { href: '/profile/portfolio', label: 'Explore Portfolio' },
  { href: '/challenges', label: 'Explore Challenges' },
  { href: '/profiles', label: 'People' },
  { href: '/profile', label: 'My Profile', auth: 'signed-in' },
  { href: '/profile/cards', label: 'My Cards', auth: 'signed-in' },
  { href: '/profile/cards/create', label: 'Create Card', auth: 'signed-in' },
  { href: '/profile/portfolios', label: 'My Portfolios', auth: 'signed-in' },
  { href: '/profile/submissions', label: 'My Submissions', auth: 'signed-in' },
  { href: '/profile/portfolios/create', label: 'Create Portfolio', auth: 'signed-in' },
  { href: '/profile/challenges', label: 'My Challenges', auth: 'signed-in' },
  { href: '/profile/challenges/create', label: 'Create Challenge', auth: 'signed-in' }
];

export default function Header() {
  const pathname = usePathname() || '/';

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="w-full border-b border-token surface-brand backdrop-blur sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
        <Link href="/" className="font-bold text-lg text-[color:var(--color-primary)]">
          Streakling
        </Link>

        <ul className="flex items-center gap-6 text-sm">
          {navItems
            .filter(item => !item.auth) // public items only here
            .map(item => {
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
          <SignedIn>
            {navItems
              .filter(item => item.auth === 'signed-in')
              .map(item => {
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
          </SignedIn>
        </ul>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-3 py-1.5 rounded-md bg-[color:var(--color-primary)] text-white text-sm font-medium hover:opacity-90"
            >
              Sign in
            </Link>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
}
