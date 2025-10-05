// src/app/(private)/profile/portfolios/create/page.tsx
import PortfolioForm from '@/components/portfolio/PortfolioForm';

export default function CreatePortfolioPage() {
  return (
    <div className='max-w-3xl mx-auto p-6'>
      <h1 className='text-2xl font-semibold'>Create Portfolio</h1>
      <div className='mt-6'>
        {/* Note: do NOT pass onSaved here; let the form redirect itself */}
        <PortfolioForm mode='create' initial={null} />
      </div>
    </div>
  );
}
