'use client';

import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import type { NavItem } from './NavConfig';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

/* Icons */
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StyleRoundedIcon from '@mui/icons-material/StyleRounded';
import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded';
import CollectionsBookmarkRoundedIcon from '@mui/icons-material/CollectionsBookmarkRounded';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import MilitaryTechRoundedIcon from '@mui/icons-material/MilitaryTechRounded';
import AddTaskRoundedIcon from '@mui/icons-material/AddTaskRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

import MagicBorder from '@/components/ui/MagicBorder';

type Props = {
  open: boolean;
  onClose: () => void;
  publicPrimary: NavItem[];
  authedPrimary: NavItem[];
  authedSecondary: NavItem[];
};

const iconFor = (href: string) => {
  switch (href) {
    case '/profiles':
      return <GroupsRoundedIcon sx={{ fontSize: 18 }} />;
    case '/profile/digitalcard':
      return <BadgeRoundedIcon sx={{ fontSize: 18 }} />;
    case '/profile/portfolio':
      return <WorkRoundedIcon sx={{ fontSize: 18 }} />;
    case '/challenges':
      return <EmojiEventsRoundedIcon sx={{ fontSize: 18 }} />;
    case '/profile':
      return <PersonRoundedIcon sx={{ fontSize: 18 }} />;
    case '/profile/cards':
      return <StyleRoundedIcon sx={{ fontSize: 18 }} />;
    case '/profile/cards/create':
      return <AddCardRoundedIcon sx={{ fontSize: 18 }} />;
    case '/profile/portfolios':
      return <CollectionsBookmarkRoundedIcon sx={{ fontSize: 18 }} />;
    case '/profile/portfolios/create':
      return <AddBoxRoundedIcon sx={{ fontSize: 18 }} />;
    case '/profile/challenges':
      return <MilitaryTechRoundedIcon sx={{ fontSize: 18 }} />;
    case '/profile/challenges/create':
      return <AddTaskRoundedIcon sx={{ fontSize: 18 }} />;
    case '/profile/submissions':
      return <SendRoundedIcon sx={{ fontSize: 18 }} />;
    default:
      return null;
  }
};

export default function SideMenu({
  open,
  onClose,
  publicPrimary,
  authedPrimary,
  authedSecondary
}: Props) {
  return (
    <>
      {/* Backdrop (fade) */}
      <div
        className={[
          'fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300',
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        ].join(' ')}
        onClick={onClose}
      />

      {/* Slide-in panel (ease-out cubic) */}
      <div
        className={[
          'fixed top-0 left-0 z-[61] h-dvh w-[22rem] max-w-[90vw]',
          'px-4 py-4',
          'transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        ].join(' ')}
      >
        <MagicBorder radius='rounded-2xl' className='h-full'>
          <aside
            className={[
              'h-full w-full rounded-2xl overflow-hidden',
              // glass + soft brand gradient (primary/secondary/tertiary)
              'backdrop-blur-xl',
              'bg-[linear-gradient(135deg,rgba(158,85,247,0.22)_0%,rgba(68,122,238,0.22)_40%,rgba(19,185,163,0.22)_100%)]',
              'border border-white/35'
            ].join(' ')}
            role='dialog'
            aria-modal='true'
            aria-label='Navigation menu'
          >
            <div className='flex items-center justify-between h-14 px-3 border-b border-white/30'>
              <span className='font-semibold'>Menu</span>
              <button
                type='button'
                className='h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/40 hover:opacity-90 bg-white/30'
                onClick={onClose}
                aria-label='Close menu'
              >
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </button>
            </div>

            <nav className='p-2 space-y-6 overflow-y-auto'>
              {/* Public primary */}
              <div>
                <p className='px-3 pb-2 text-xs uppercase tracking-wide opacity-80'>
                  Browse
                </p>
                <ul className='space-y-1'>
                  {publicPrimary.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className='flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/40'
                        onClick={onClose}
                      >
                        {iconFor(link.href)}
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Signed-in sections (ALL extras shown here) */}
              <SignedIn>
                <div>
                  <p className='px-3 pb-2 text-xs uppercase tracking-wide opacity-80'>
                    Your area
                  </p>
                  <ul className='space-y-1'>
                    {authedPrimary.concat(authedSecondary).map(link => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className='flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/40'
                          onClick={onClose}
                        >
                          {iconFor(link.href)}
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </SignedIn>

              <SignedOut>
                <div className='px-3 text-sm opacity-90'>
                  Sign in to see your profile and creator tools.
                </div>
              </SignedOut>
            </nav>
          </aside>
        </MagicBorder>
      </div>
    </>
  );
}
