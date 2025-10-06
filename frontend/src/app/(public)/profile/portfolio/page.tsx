// src/app/portfolios/page.tsx
import PortfolioExploreGrid from '@/components/portfolio/PortfolioExploreGrid';

export const metadata = {
  title: 'Explore Portfolios',
  description: 'Browse all published portfolios'
};

export default function PortfoliosExplorePage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Explore Portfolios</h1>
      <PortfolioExploreGrid />
    </main>
  );
}
