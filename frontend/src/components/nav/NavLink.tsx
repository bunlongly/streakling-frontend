'use client';

import Link from 'next/link';

export default function NavLink({
  href,
  label,
  className
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        'relative px-3 py-2 text-[13px] uppercase tracking-wide',
        'opacity-90 hover:opacity-100 transition-colors',
        className ?? ''
      ].join(' ')}
    >
      {label}
    </Link>
  );
}
