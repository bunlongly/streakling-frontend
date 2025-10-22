'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: Element,
        opts: {
          sitekey: string;
          action?: string;
          cData?: string;
          theme?: 'auto' | 'light' | 'dark';
          appearance?: 'always' | 'execute' | 'interaction-only';
          retry?: 'auto' | 'never';
          'retry-interval'?: number;
          'refresh-expired'?: 'auto' | 'manual';
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
        }
      ) => string; // widget id
      remove: (widgetId: string) => void;
      reset?: (widgetId: string) => void;
    };
  }
}

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  action?: string; // for CF analytics labeling, e.g. 'auth'
};

export default function TurnstileGate({
  children,
  title = "Quick check — please verify you're human",
  subtitle = 'This helps us keep your account safe.',
  className,
  action = 'auth'
}: Props) {
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Fallback to CF test site key in dev if missing
  const siteKey = useMemo(() => {
    const k = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
    if (k && k !== 'undefined') return k;
    return '1x00000000000000000000AA'; // CF test client key
  }, []);

  const mountWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;
    // Clean old instance if any
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {}
      widgetIdRef.current = null;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: 'auto',
      appearance: 'always',
      retry: 'auto',
      'refresh-expired': 'auto',
      callback: async (token: string) => {
        setErr(null);
        setMsg(null);
        setSubmitting(true);
        try {
          const res = await fetch('/api/turnstile/verify', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          const data = await res.json();
          if (data?.ok) {
            setMsg('Verified ✔ You can continue.');
            setVerified(true);
          } else {
            setErr('Verification failed. Please try again.');
          }
        } catch {
          setErr('Network error. Please try again.');
        } finally {
          setSubmitting(false);
        }
      },
      'error-callback': () => {
        setErr('Turnstile error. Please refresh and try again.');
        setMsg(null);
      },
      'expired-callback': () => {
        setErr('The challenge expired. Please verify again.');
        setMsg(null);
      }
    });
  }, [siteKey, action]);

  useEffect(() => {
    // Load script once per mount
    if (!window.turnstile) {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      s.defer = true;
      s.onload = () => mountWidget();
      document.head.appendChild(s);
      scriptRef.current = s;
    } else {
      mountWidget();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [mountWidget]);

  const handleRetry = () => {
    setErr(null);
    setMsg(null);
    // rebuild widget
    mountWidget();
  };

  if (verified) return <>{children}</>;

  const usingTestKey =
    siteKey === '1x00000000000000000000AA' &&
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '1x00000000000000000000AA';

  return (
    <div
      className={
        className ?? 'min-h-dvh grid place-items-center bg-brand-mix p-6'
      }
    >
      <div className='w-full max-w-md'>
        <div className='rounded-2xl border border-gray-200 bg-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden'>
          {/* Header */}
          <div className='px-6 pt-6 pb-3'>
            <div className='flex items-center gap-2'>
              <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600'>
                <svg
                  viewBox='0 0 24 24'
                  className='h-4 w-4'
                  fill='currentColor'
                >
                  <path d='M12 2l7 3v6c0 5-3.4 9.4-7 10-3.6-.6-7-5-7-10V5l7-3z' />
                </svg>
              </span>
              <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
                {title}
              </h1>
            </div>
            <p className='mt-1 text-sm text-gray-600'>{subtitle}</p>
          </div>

          <div className='h-px bg-gray-100' />

          <div className='px-6 py-5'>
            {usingTestKey && (
              <div className='mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800'>
                Using Cloudflare <strong>test</strong> site key (dev). Set{' '}
                <code className='font-mono'>
                  NEXT_PUBLIC_TURNSTILE_SITE_KEY
                </code>{' '}
                for real checks.
              </div>
            )}

            <div className='flex justify-center'>
              <div ref={containerRef} />
            </div>

            {submitting && (
              <div className='mt-4 text-sm text-gray-600'>Verifying…</div>
            )}
            {msg && (
              <div className='mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>
                {msg}
              </div>
            )}
            {err && (
              <div className='mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700'>
                <div className='flex items-start justify-between gap-3'>
                  <span>{err}</span>
                  <button
                    type='button'
                    onClick={handleRetry}
                    className='shrink-0 rounded-md border border-red-200 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50'
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <p className='mt-5 text-[11px] text-gray-500'>
              Protected by Cloudflare Turnstile. Privacy-first, no tracking
              cookies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
