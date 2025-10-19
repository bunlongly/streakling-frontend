// src/app/(public)/profile/digitalcard/[slug]/page.tsx
import { notFound } from 'next/navigation';
import PublicDigitalCard from '@/components/PublicDigitalCard';
import { http } from '@/lib/api';
import type { ApiSuccess } from '@/lib/api';
import type { DigitalCard } from '@/types/digitalCard';

export const revalidate = 0; // always fresh

function hasStatus(x: unknown): x is { status?: number } {
  return typeof x === 'object' && x !== null && 'status' in x;
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params; 

  let payload: ApiSuccess<DigitalCard>;
  try {
    payload = await http.get<ApiSuccess<DigitalCard>>(
      `/api/digital-name-card/slug/${encodeURIComponent(slug)}`,
      { cache: 'no-store' }
    );
  } catch (e: unknown) {
    if (hasStatus(e) && e.status === 404) {
      notFound();
    }
    throw e; // preserve original error object
  }

  const card = payload?.data;
  if (!card) {
    notFound();
  }

  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      <PublicDigitalCard card={card} />
    </div>
  );
}
