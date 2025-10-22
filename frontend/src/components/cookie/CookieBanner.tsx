'use client';

import { useEffect, useId, useState } from 'react';
import {
  type Consent,
  defaultConsent,
  readClientConsent,
  writeClientConsent
} from '@/lib/consent-client'; // 👈 client-only import

type Props = {
  className?: string;
  /** Delay (ms) before showing the banner on first visit. Default: 5000 */
  delayMs?: number;
  /** Show small "Privacy / Cookies" links that do nothing (preventDefault). Default: true */
  showPlaceholderLinks?: boolean;
};

const CONSENT_COOKIE_NAME = 'consent.v1';

function hasConsentCookie(): boolean {
  return document.cookie.includes(`${CONSENT_COOKIE_NAME}=`);
}

export default function CookieBanner({
  className,
  delayMs = 5000,
  showPlaceholderLinks = true
}: Props) {
  // --- Banner mount + animation state ---
  const [shouldMount, setShouldMount] = useState(false);
  const [visible, setVisible] = useState(false);

  // --- Preferences modal state ---
  const [prefsOpen, setPrefsOpen] = useState(false);

  // --- Consent state ---
  const [consent, setConsent] = useState<Consent>(defaultConsent);
  const modalId = useId();

  // Show banner after delay ONLY if there is no consent cookie yet
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (hasConsentCookie()) {
      setShouldMount(false);
      return;
    }

    setConsent(defaultConsent);
    setShouldMount(true);

    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  // Sync consent state on mount (edge cases)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (hasConsentCookie()) {
      setShouldMount(false);
    } else {
      try {
        setConsent(readClientConsent());
      } catch {
        // ignore
      }
    }
  }, []);

  const applyConsent = (c: Consent) => {
    writeClientConsent(c);
    // Optionally sync to Zaraz here:
    // (window as any).zaraz?.setConsent?.({
    //   analytics: c.analytics,
    //   advertising: c.marketing,
    //   functionality: c.functionality,
    // });
  };

  const closeBanner = () => {
    setVisible(false);
    // Unmount after animation ends (duration-300)
    setTimeout(() => setShouldMount(false), 300);
  };

  const acceptAll = () => {
    const c: Consent = {
      necessary: true as const,
      analytics: true,
      marketing: true,
      functionality: true
    };
    setConsent(c);
    applyConsent(c);
    setPrefsOpen(false);
    closeBanner();
  };

  const rejectNonEssential = () => {
    const c: Consent = {
      necessary: true as const,
      analytics: false,
      marketing: false,
      functionality: true
    };
    setConsent(c);
    applyConsent(c);
    setPrefsOpen(false);
    closeBanner();
  };

  const savePrefs = () => {
    const c: Consent = {
      necessary: true as const,
      analytics: consent.analytics,
      marketing: consent.marketing,
      functionality: consent.functionality
    };
    setConsent(c);
    applyConsent(c);
    setPrefsOpen(false);
    closeBanner();
  };

  if (!shouldMount) return null;

  // Smooth pop: opacity + translate + scale
  const panelBase =
    'mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white/90 backdrop-blur shadow-lg transition-all duration-300 will-change-transform';
  const panelAnim = visible
    ? 'opacity-100 translate-y-0 scale-100'
    : 'opacity-0 translate-y-4 scale-95 pointer-events-none';

  return (
    <div className={className}>
      {/* Banner */}
      <div className='fixed inset-x-0 bottom-0 z-50 mx-auto w-full px-4 pb-4 sm:px-6 md:px-8'>
        <div className={`${panelBase} ${panelAnim}`}>
          <div className='p-4 sm:p-5'>
            <div className='flex items-start gap-3'>
              <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600'>
                <svg
                  viewBox='0 0 24 24'
                  className='h-4 w-4'
                  fill='currentColor'
                >
                  <path d='M12 2l7 3v6c0 5-3.4 9.4-7 10-3.6-.6-7-5-7-10V5l7-3z' />
                </svg>
              </span>
              <div className='min-w-0 flex-1'>
                <h3 className='text-sm font-semibold text-gray-900'>
                  We value your privacy
                </h3>
                <p className='mt-1 text-sm text-gray-600'>
                  We use cookies to improve your experience, analyze traffic,
                  and for optional marketing. You can accept all, reject
                  non-essential, or manage preferences.
                </p>

                {showPlaceholderLinks && (
                  <div className='mt-2 text-xs text-gray-500'>
                    <a
                      href='#'
                      onClick={e => e.preventDefault()}
                      className='underline'
                      aria-disabled
                    >
                      Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a
                      href='#'
                      onClick={e => e.preventDefault()}
                      className='underline'
                      aria-disabled
                    >
                      Cookie Policy
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className='mt-4 flex flex-wrap justify-end gap-2'>
              <button
                type='button'
                onClick={() => setPrefsOpen(true)}
                className='rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50'
              >
                Manage preferences
              </button>
              <button
                type='button'
                onClick={rejectNonEssential}
                className='rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50'
              >
                Reject non-essential
              </button>
              <button
                type='button'
                onClick={acceptAll}
                className='rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700'
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences modal */}
      {prefsOpen && (
        <div
          role='dialog'
          aria-labelledby={modalId}
          className='fixed inset-0 z-50 grid place-items-center bg-black/40 p-4'
        >
          <div className='w-full max-w-lg animate-[fadeIn_180ms_ease-out] rounded-2xl border border-gray-200 bg-white shadow-xl'>
            <div className='px-5 pt-4 pb-2'>
              <h2
                id={modalId}
                className='text-base font-semibold text-gray-900'
              >
                Cookie preferences
              </h2>
              <p className='mt-1 text-sm text-gray-600'>
                Choose which categories you want to allow. You can change this
                anytime.
              </p>
            </div>

            <div className='h-px bg-gray-100' />

            <div className='space-y-4 p-5'>
              <Row
                label='Necessary'
                desc='Required for basic site functionality. Always on.'
                checked
                disabled
                onChange={() => {}}
              />
              <Row
                label='Functionality'
                desc='Remember your preferences (e.g., theme, language).'
                checked={consent.functionality}
                onChange={v => setConsent(s => ({ ...s, functionality: v }))}
              />
              <Row
                label='Analytics'
                desc='Anonymous usage analytics to help us improve.'
                checked={consent.analytics}
                onChange={v => setConsent(s => ({ ...s, analytics: v }))}
              />
              <Row
                label='Marketing'
                desc='Personalized content and ads.'
                checked={consent.marketing}
                onChange={v => setConsent(s => ({ ...s, marketing: v }))}
              />
            </div>

            <div className='h-px bg-gray-100' />
            <div className='flex justify-end gap-2 p-4'>
              <button
                type='button'
                onClick={() => setPrefsOpen(false)}
                className='rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={savePrefs}
                className='rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700'
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  desc,
  checked,
  disabled,
  onChange
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className='flex items-start gap-3'>
      <input
        type='checkbox'
        className='mt-[2px] h-4 w-4 rounded border-gray-300'
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
      />
      <div>
        <div className='text-sm font-medium text-gray-900'>{label}</div>
        <div className='text-xs text-gray-600'>{desc}</div>
      </div>
    </label>
  );
}
