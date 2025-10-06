// src/app/digitalcards/page.tsx
import CardExploreGrid from '@/components/digital-card/cards/CardExploreGrid';

export const metadata = {
  title: 'Digital Cards',
  description: 'Browse published digital name cards'
};

export default function DigitalCardsPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <CardExploreGrid />
    </main>
  );
}
