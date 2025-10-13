// src/app/(private)/profile/portfolios/[id]/page.tsx
import { headers } from 'next/headers';
import { api } from '@/lib/api';
import PortfolioForm from '@/components/portfolio/PortfolioForm';
import DeletePortfolioButton from '@/components/portfolio/DeletePortfolioButton';

export default async function EditPortfolioPage({
  params
}: {
  // Next 15 route-segment: params is a Promise
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Forward cookies so the backend auth works server-side
  const cookieHeader = (await headers()).get('cookie') ?? '';
  const { data: initial } = await api.portfolio.getById(id, {
    headers: { cookie: cookieHeader }
  });

  return (
    <main className='min-h-dvh bg-brand-mix'>
      <section className='max-w-5xl mx-auto mt-16 px-4 md:px-6 pb-10'>
        <div className='flex items-center justify-between gap-3 sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-4 backdrop-blur supports-[backdrop-filter]:bg-white/30 rounded-2xl border border-white/40'>
          <h1 className='h1'>Edit Portfolio</h1>
          <DeletePortfolioButton id={id} />
        </div>

        <div className='rounded-3xl border border-token bg-surface/70 shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)] p-4 md:p-6'>
          <PortfolioForm mode='edit' portfolioId={id} initial={initial} />
        </div>
      </section>
    </main>
  );
}
