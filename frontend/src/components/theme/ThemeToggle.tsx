// src/components/theme/ThemeToggle.tsx
'use client';

import { useEffect, useState } from 'react';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';

type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');

  // mount: read actual theme chosen by no-flash script or system
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const current =
      saved ??
      (document.documentElement.getAttribute('data-theme') as Theme) ??
      getSystemTheme();
    setTheme(current);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [mounted, theme]);

  useEffect(() => {
    if (!mounted) return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      if (!localStorage.getItem('theme')) setTheme(getSystemTheme());
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mounted]);

  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  // Until mounted, render a neutral button to avoid SSR/client mismatch
  if (!mounted) {
    return (
      <button
        type='button'
        aria-hidden
        className='inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm
                   bg-[color:var(--color-surface)] border border-token opacity-0'
        tabIndex={-1}
      />
    );
  }

  const isLight = theme === 'light';
  return (
    <button
      type='button'
      onClick={toggle}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      className='inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm
                 bg-[color:var(--color-surface)] border border-token hover:opacity-90 transition'
      title={isLight ? 'Light mode' : 'Dark mode'}
    >
      {isLight ? (
        <LightModeRoundedIcon sx={{ fontSize: 18 }} />
      ) : (
        <DarkModeRoundedIcon sx={{ fontSize: 18 }} />
      )}
      <span className='hidden sm:inline'>{isLight ? 'Light' : 'Dark'}</span>
    </button>
  );
}
