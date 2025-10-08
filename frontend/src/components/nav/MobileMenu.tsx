'use client';

import Link from 'next/link';
import { SignedIn } from '@clerk/nextjs';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { usePathname } from 'next/navigation';
import type { NavItem } from './NavConfig';

export default function MobileMenu({
  open,
  onClose,
  publicItems,
  authedItems
}: {
  open: boolean;
  onClose: () => void;
  publicItems: NavItem[];
  authedItems: NavItem[];
}) {
  const pathname = usePathname() || '/';
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute right-0 top-0 h-full w-[84%] max-w-xs bg-[color:var(--color-surface)]
                   border-l border-token shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-token surface-brand">
          <span className="font-semibold">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg h-9 w-9
                       bg-[color:var(--color-surface)] border border-token"
            aria-label="Close menu"
          >
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </button>
        </div>

        <nav className="p-2 overflow-y-auto">
          <ul className="flex flex-col gap-1">
            {publicItems.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    'block rounded-lg px-3 py-2 text-sm transition-colors',
                    'hover:bg-[color:var(--color-primary)]/10',
                    isActive(item.href) ? 'text-[color:var(--color-accent)]' : 'opacity-90'
                  ].join(' ')}
                  onClick={onClose}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <SignedIn>
              <div className="mt-2 border-t border-token" />
              {authedItems.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      'block rounded-lg px-3 py-2 text-sm transition-colors',
                      'hover:bg-[color:var(--color-primary)]/10',
                      isActive(item.href) ? 'text-[color:var(--color-accent)]' : 'opacity-90'
                    ].join(' ')}
                    onClick={onClose}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </SignedIn>
          </ul>
        </nav>
      </div>
    </div>
  );
}
