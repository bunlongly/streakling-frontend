// src/app/profile/digitalcard/[slug]/page.tsx
import { notFound } from 'next/navigation';
import PublicDigitalCard from '@/components/PublicDigitalCard';
import { http } from '@/lib/api';
import type { ApiSuccess } from '@/lib/api';
import type { DigitalCard } from '@/types/digitalCard';

type PageProps = {
  params: { slug: string };
};

export const revalidate = 0; // always fresh

function hasStatus(x: unknown): x is { status?: number } {
  return typeof x === 'object' && x !== null && 'status' in x;
}

export default async function Page({ params }: PageProps) {
  const { slug } = params;

  let payload: ApiSuccess<DigitalCard>;
  try {
    payload = await http.get<ApiSuccess<DigitalCard>>(
      `/api/digital-name-card/slug/${encodeURIComponent(slug)}`,
      { cache: 'no-store' }
    );
  } catch (e: unknown) {
    if (hasStatus(e) && e.status === 404) return notFound();
    throw e; // preserve original error object
  }

  const card = payload?.data;
  if (!card) return notFound();

  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      <PublicDigitalCard card={card} />
    </div>
  );
}
