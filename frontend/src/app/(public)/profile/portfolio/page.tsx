import Link from 'next/link';
import PortfolioExploreGrid from '@/components/portfolio/PortfolioExploreGrid';

export const metadata = {
  title: 'Explore Portfolios',
  description: 'Browse all published portfolios'
};

export default function PortfoliosExplorePage() {
  return (
    <main
      className='
        min-h-[80vh]
        bg-[radial-gradient(1200px_500px_at_-10%_-20%,rgba(158,85,247,0.12)_0%,transparent_55%),radial-gradient(900px_400px_at_120%_120%,rgba(68,122,238,0.10)_0%,transparent_60%)]
      '
    >
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6'>
        <header className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Portfolios
            </h1>
            <p className='text-sm text-gray-600'>
              Discover published work from creators. Click a row to view
              details.
            </p>
          </div>

          {/* Create Portfolio (matches nav: /profile/portfolios/create) */}
          <Link
            href='/profile/portfolios/create'
            className='
              inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
              bg-gradient-to-r from-[#9e55f7] to-[#447aee] text-white
              shadow-sm hover:opacity-95 active:opacity-90
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500
            '
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden='true'
            >
              <path
                d='M12 5v14M5 12h14'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              />
            </svg>
            Create Portfolio
          </Link>
        </header>

        <PortfolioExploreGrid />
      </div>
    </main>
  );
}
