// e.g. src/app/settings/billing/page.tsx
'use client';
import { useEffect, useState } from 'react';
import ManageBillingButton from '@/components/billing/ManageBillingButton';
import InvoiceTable from '@/components/billing/InvoiceTable';

async function fetchMe() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/api/session/me`,
    { credentials: 'include' }
  );
  if (!res.ok) return {};
  const data = await res.json();
  return {
    plan: data?.user?.plan ?? 'free',
    subscriptionStatus: data?.user?.subscriptionStatus ?? null,
    currentPeriodEnd: data?.user?.currentPeriodEnd ?? null
  } as {
    plan?: 'free' | 'basic' | 'pro' | 'ultimate';
    subscriptionStatus?: string | null;
    currentPeriodEnd?: string | null;
  };
}

export default function BillingSettingsPage() {
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get('session_id');

    const run = async () => {
      if (sessionId) {
        // finalize + persist on the server
        await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE
          }/api/billing/finalize?session_id=${encodeURIComponent(sessionId)}`,
          { credentials: 'include' }
        );
        // clean the URL
        url.searchParams.delete('session_id');
        window.history.replaceState({}, '', url.toString());
      }
      const meData = await fetchMe();
      setMe(meData);
    };
    run();
  }, []);

  return (
    <main className='mx-auto max-w-4xl px-4 py-10'>
      <h1 className='text-2xl font-semibold'>Billing</h1>
      <p className='mt-1 text-sm text-gray-600'>
        Manage your subscription and invoices.
      </p>

      <section className='mt-6 rounded-2xl border border-black/10 bg-white p-5'>
        <h2 className='text-lg font-semibold'>Your plan</h2>
        {me ? (
          <div className='mt-2 flex flex-wrap items-center gap-3 text-sm'>
            <span className='inline-flex items-center rounded-full bg-gray-100 px-3 py-1'>
              {me.plan ?? 'free'}
            </span>
            {me.subscriptionStatus && (
              <span className='inline-flex items-center rounded-full bg-gray-100 px-3 py-1'>
                {me.subscriptionStatus}
              </span>
            )}
            <ManageBillingButton className='ml-auto' />
          </div>
        ) : (
          <p className='text-sm text-gray-500'>Loading…</p>
        )}
      </section>

      <section className='mt-8'>
        <h2 className='mb-3 text-lg font-semibold'>Invoices</h2>
        <InvoiceTable />
      </section>
    </main>
  );
}
