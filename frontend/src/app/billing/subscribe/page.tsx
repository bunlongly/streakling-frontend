// src/app/billing/subscribe/page.tsx
'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type Plan = 'basic' | 'pro' | 'ultimate';

export default function SubscribeRedirectPage() {
  return (
    <Suspense
      fallback={
        <main className='mx-auto max-w-md py-24 text-center'>
          <h1 className='text-xl font-semibold'>Preparing secure checkout…</h1>
          <p className='mt-2 text-sm text-gray-500'>
            You’ll be redirected to Stripe.
          </p>
        </main>
      }
    >
      <SubscribeInner />
    </Suspense>
  );
}

function SubscribeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const plan = (params.get('plan') as Plan | null) ?? null;

  useEffect(() => {
    (async () => {
      if (!plan) {
        router.replace('/pricing?error=no-plan');
        return;
      }

      const base = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!base) {
        console.error('Missing NEXT_PUBLIC_BACKEND_URL');
        router.replace('/pricing?error=missing-backend-url');
        return;
      }

      try {
        const res = await fetch(`${base}/api/billing/checkout`, {
          method: 'POST',
          credentials: 'include', // send your session cookie
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan })
        });

        const data = await res.json().catch(() => ({}) as any);

        if (res.ok && data?.url) {
          window.location.href = data.url; // jump to Stripe Checkout
        } else {
          console.error('Checkout failed:', data);
          router.replace('/pricing?error=checkout');
        }
      } catch (err) {
        console.error('Network error:', err);
        router.replace('/pricing?error=network');
      }
    })();
  }, [plan, router]);

  return (
    <main className='mx-auto max-w-md py-24 text-center'>
      <h1 className='text-xl font-semibold'>Preparing secure checkout…</h1>
      <p className='mt-2 text-sm text-gray-500'>
        You’ll be redirected to Stripe.
      </p>
    </main>
  );
}
