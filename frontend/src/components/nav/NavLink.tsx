'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({
  href,
  label,
  className
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const pathname = usePathname() || '/';
  const active =
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={[
        'relative px-3 py-2 text-sm rounded-lg transition-colors',
        'hover:text-[color:var(--color-accent)]',
        active ? 'text-[color:var(--color-accent)]' : 'opacity-90',
        className ?? ''
      ].join(' ')}
    >
      {label}
      <span
        aria-hidden
        className={[
          'pointer-events-none absolute left-2 right-2 -bottom-1 h-[2px] rounded-full transition-opacity',
          active ? 'opacity-100 bg-[color:var(--color-accent)]' : 'opacity-0'
        ].join(' ')}
      />
    </Link>
  );
}
