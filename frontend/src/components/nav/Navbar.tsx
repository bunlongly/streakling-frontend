'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import NavLink from './NavLink';
import SideMenu from './SideMenu';
import {
  PUBLIC_PRIMARY,
  AUTHED_PRIMARY,
  AUTHED_SECONDARY,
  buildPrimaryNav,
  type Role
} from './NavConfig';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api, type ApiSuccess } from '@/lib/api';

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

type ProfileMe = { role: Exclude<Role, undefined>; username?: string };

export default function Navbar() {
  const [openSide, setOpenSide] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync();

  const [role, setRole] = useState<Role>(undefined);
  const [loadingMe, setLoadingMe] = useState(false);

  // Scroll-aware background (down = show, top/up = hide)
  const [showBg, setShowBg] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      setShowBg(y > 4 && goingDown);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Backend role (typed)
  useEffect(() => {
    let stop = false;
    async function loadMe() {
      if (!isLoaded || !isSignedIn || !synced) return;
      setLoadingMe(true);
      try {
        const res = await api.profile.get();
        const { data } = res as ApiSuccess<ProfileMe>;
        if (!stop) setRole(data?.role ?? undefined);
      } catch {
        if (!stop) setRole(undefined);
      } finally {
        if (!stop) setLoadingMe(false);
      }
    }
    loadMe();
    return () => {
      stop = true;
    };
  }, [isLoaded, isSignedIn, synced]);

  // Build menus
  const primaryNav = useMemo(
    () => buildPrimaryNav({ signedIn: !!isSignedIn, role }),
    [isSignedIn, role]
  );

  const sideAuthedSecondary =
    role === 'ADMIN'
      ? [
          ...AUTHED_SECONDARY,
          { href: '/admin', label: 'Admin', auth: 'signed-in' as const }
        ]
      : AUTHED_SECONDARY;

  // ===== Scroll UI: only when N>4 AND content actually overflows =====
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // ✅ Memoize recompute so eslint/react-hooks deps are satisfied
  const recompute = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const overflows = el.scrollWidth - el.clientWidth > 1;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);

    // Enable scroll UI only if we have more than 4 items AND overflow exists.
    // If 4 or fewer -> force no-scroll so the row can center nicely on mobile.
    setNeedsScroll(primaryNav.length > 4 && overflows);
  }, [primaryNav.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    recompute();

    el.addEventListener('scroll', recompute, { passive: true });

    // Watch width/font changes that could cause overflow to change
    const ro = new ResizeObserver(() => recompute());
    ro.observe(el);

    window.addEventListener('resize', recompute);

    return () => {
      el.removeEventListener('scroll', recompute);
      window.removeEventListener('resize', recompute);
      ro.disconnect();
    };
  }, [recompute]); // ✅ include recompute, not primaryNav.length directly

  const scrollByAmount = (dir: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.6);
    el.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <motion.header
        initial={false}
        animate={
          showBg
            ? { backdropFilter: 'blur(12px)' }
            : { backdropFilter: 'blur(0px)' }
        }
        className={cx(
          'sticky top-0 z-50 transition-colors duration-300',
          'border-b transition-[backdrop-filter,border-color] ease-out',
          showBg
            ? 'bg-white/60 border-white/30'
            : 'bg-transparent border-transparent'
        )}
      >
        {/* Top row */}
        <div className='relative h-16 sm:h-18 md:h-20 lg:h-24'>
          <div className='max-w-7xl mx-auto h-full px-3 sm:px-4 md:px-6'>
            <div className='h-full grid grid-cols-3 items-center gap-2'>
              {/* Left: Hamburger */}
              <div className='flex items-center'>
                <motion.button
                  type='button'
                  onClick={() => setOpenSide(true)}
                  className='inline-flex items-center justify-center rounded-lg h-9 w-9 border border-white/40 hover:opacity-90 bg-white/50'
                  aria-label='Open navigation menu'
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <MenuRoundedIcon sx={{ fontSize: 20 }} />
                </motion.button>
              </div>

              {/* Center: Logo */}
              <div className='flex items-center justify-center'>
                <Link
                  href='/'
                  aria-label='Streakling Home'
                  className='flex items-center justify-center'
                >
                  <Image
                    src='/logo.png'
                    alt='Streakling'
                    width={640}
                    height={160}
                    priority
                    sizes='(max-width: 640px) 200px, (max-width: 1024px) 280px, 360px'
                    className='h-10 sm:h-12 md:h-16 lg:h-20 w-auto select-none'
                  />
                </Link>
              </div>

              {/* Right: Account */}
              <div className='flex items-center justify-end gap-2'>
                <AnimatePresence initial={false}>
                  {isSignedIn && loadingMe && (
                    <motion.span
                      key='dot'
                      className='inline-block h-2 w-2 rounded-full bg-gray-300'
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                    />
                  )}
                </AnimatePresence>

                <SignedIn>
                  <UserButton afterSignOutUrl='/' />
                </SignedIn>
                <SignedOut>
                  <Link
                    href='/sign-in'
                    aria-label='Sign in or register'
                    className='inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/40 bg-white/50 hover:opacity-90'
                    title='Sign in / Register'
                  >
                    <AccountCircleRoundedIcon sx={{ fontSize: 22 }} />
                  </Link>
                </SignedOut>
              </div>
            </div>
          </div>
        </div>

        {/* Centered short underline (subtle, responsive) */}
        <div className='flex justify-center'>
          <div
            className={cx(
              'border-t border-white/30 transition-opacity duration-300',
              'w-20 sm:w-24 md:w-28 lg:w-32',
              showBg ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>

        {/* Nav row — MOBILE: only scroll when needed; DESKTOP: wrap */}
        <div className='relative'>
          {/* edge gradients visible only when scrolling on mobile */}
          <div
            className={cx(
              'pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white/70 to-transparent transition-opacity md:hidden',
              needsScroll ? 'opacity-100' : 'opacity-0'
            )}
          />
          <div
            className={cx(
              'pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white/70 to-transparent transition-opacity md:hidden',
              needsScroll ? 'opacity-100' : 'opacity-0'
            )}
          />

          {/* arrows only on mobile + only when needed */}
          <div className={cx('md:hidden', needsScroll ? '' : 'hidden')}>
            <AnimatePresence initial={false}>
              {needsScroll && canScrollLeft && (
                <motion.button
                  key='left'
                  onClick={() => scrollByAmount('left')}
                  className='absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/70 border border-white/40 shadow-sm'
                  aria-label='Scroll left'
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                >
                  ‹
                </motion.button>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {needsScroll && canScrollRight && (
                <motion.button
                  key='right'
                  onClick={() => scrollByAmount('right')}
                  className='absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/70 border border-white/40 shadow-sm'
                  aria-label='Scroll right'
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                >
                  ›
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <nav className='max-w-7xl mx-auto px-2 sm:px-4 md:px-6'>
            {/* Wrapper hides overlay scrollbars if they appear on some browsers */}
            <div className='overflow-hidden'>
              <ul
                ref={scrollerRef}
                className={cx(
                  // Mobile behavior:
                  needsScroll
                    ? 'flex items-center gap-1 whitespace-nowrap overflow-x-auto overflow-y-hidden scrollbar-none px-4 pb-3 -mb-3 justify-start'
                    : 'flex items-center gap-1 whitespace-nowrap overflow-visible px-4 justify-center',
                  // md+: wrap & center
                  'md:flex-wrap md:whitespace-normal md:overflow-visible md:pb-0 md:mb-0 md:px-0 md:justify-center',
                  // height
                  'h-12 md:h-auto'
                )}
              >
                {primaryNav.map(item => (
                  <li key={item.href} className='shrink-0 md:shrink'>
                    <NavLink href={item.href} label={item.label} />
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Side menu */}
      <SideMenu
        open={openSide}
        onCloseAction={() => setOpenSide(false)}
        publicPrimary={PUBLIC_PRIMARY}
        authedPrimary={AUTHED_PRIMARY}
        authedSecondary={sideAuthedSecondary}
      />
    </>
  );
}
