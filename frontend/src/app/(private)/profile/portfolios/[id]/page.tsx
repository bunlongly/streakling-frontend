import { headers } from 'next/headers';
import { api } from '@/lib/api';
import PortfolioForm from '@/components/portfolio/PortfolioForm';
import DeletePortfolioButton from '@/components/portfolio/DeletePortfolioButton';

export default async function EditPortfolioPage({
  params
}: {
  // 👇 Next 15: params is a Promise
  params: Promise<{ id: string }>;
}) {
  // ✅ await params before using it
  const { id } = await params;

  // ✅ forward the user's cookies to the backend (so /api/portfolios/:id is authorized)
  const cookieHeader = (await headers()).get('cookie') ?? '';

  const { data: initial } = await api.portfolio.getById(id, {
    headers: { cookie: cookieHeader }
  });

  return (
    <div className='max-w-3xl mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Edit Portfolio</h1>
        <DeletePortfolioButton id={id} />
      </div>
      <PortfolioForm mode='edit' portfolioId={id} initial={initial} />
    </div>
  );
}
