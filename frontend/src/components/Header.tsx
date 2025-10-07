'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/profile/digitalcard', label: 'Explore Digital card' },
  { href: '/profile/portfolio', label: 'Explore Portfolio' },
  { href: '/profiles', label: 'People' },
  { href: '/profile', label: 'My Profile', auth: 'signed-in' },
  { href: '/profile/cards', label: 'My Cards' }, // list
  { href: '/profile/cards/create', label: 'Create Card' }, // create
  { href: '/profile/portfolios', label: 'My Portfolios' },
  { href: '/profile/portfolios/create', label: 'Create Portfolio' }
];

export default function Header() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

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
          {navItems.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`hover:text-[color:var(--color-accent)] transition ${
                  pathname === item.href
                    ? 'text-[color:var(--color-accent)] font-medium'
                    : ''
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
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
