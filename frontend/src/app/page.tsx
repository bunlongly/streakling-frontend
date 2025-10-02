'use client';
import Header from '@/components/Header';

export default function HomePage() {
  return (
    <main className='min-h-dvh bg-brand-mix'>
      <Header />
      <section className='max-w-3xl mx-auto mt-16 p-6 card-surface'>
        <h1 className='h1'>Hello, Streakling!</h1>
        <p className='mt-2 muted'>
          Next.js + Clerk + cookie session with your backend.
        </p>
      </section>
    </main>
  );
}
