'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SubscribeRedirectPage() {
  const params = useSearchParams();
  const router = useRouter();
  const plan = params.get('plan') as 'basic' | 'pro' | 'ultimate' | null;

  useEffect(() => {
    (async () => {
      if (!plan) {
        router.replace('/pricing?error=no-plan');
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/billing/checkout`,
          {
            method: 'POST',
            credentials: 'include', // send your session cookie
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan })
          }
        );

        const data = await res.json();
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
    <main className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-xl font-semibold">Preparing secure checkout…</h1>
      <p className="mt-2 text-sm text-gray-500">
        You’ll be redirected to Stripe.
      </p>
    </main>
  );
}
