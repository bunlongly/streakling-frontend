'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function DeletePortfolioButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onDelete() {
    if (!confirm('Delete this portfolio? This cannot be undone.')) return;
    setLoading(true);
    try {
      await api.portfolio.deleteById(id);
      router.push('/profile/portfolios');
      router.refresh();
    } catch (e) {
      alert((e as Error).message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type='button'
      onClick={onDelete}
      disabled={loading}
      className='rounded bg-red-600 px-3 py-2 text-white text-sm disabled:opacity-60'
      title='Delete portfolio'
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  );
}
