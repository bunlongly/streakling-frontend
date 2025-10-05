'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type Props = { id: string };

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'Failed to delete card';
}

export default function DeleteCardButton({ id }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onDelete = async () => {
    setLoading(true);
    try {
      await api.card.deleteById(id);
      router.push('/profile/cards');
      router.refresh();
    } catch (e: unknown) {
      alert(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type='button'
        className='btn-ghost text-red-400 hover:text-red-300'
        onClick={() => setOpen(true)}
      >
        Delete
      </button>
      {open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <button
            type='button'
            aria-label='Close'
            className='absolute inset-0 bg-black/60'
            onClick={() => setOpen(false)}
          />
          <div className='relative z-10 w-full max-w-sm rounded-2xl p-5 card-surface border border-white/10'>
            <h2 className='text-lg font-semibold mb-2'>Delete this card?</h2>
            <p className='text-sm text-white/70'>
              This action cannot be undone.
            </p>
            <div className='mt-4 flex justify-end gap-2'>
              <button
                type='button'
                className='btn-secondary'
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type='button'
                className='btn bg-red-600 hover:bg-red-500'
                onClick={onDelete}
                disabled={loading}
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
