'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import type {
  CreateSubmissionInput,
  ChallengeSubmission
} from '@/types/challenge';
import type { ReactNode } from 'react';

/* Small, local modal */
function ConfirmModal(props: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const {
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onClose,
    children
  } = props;
  if (!open) return null;
  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center'>
      <div
        className='absolute inset-0 bg-black/40 backdrop-blur-[2px]'
        onClick={onClose}
        aria-hidden
      />
      <div className='relative z-[61] w-full max-w-md rounded-2xl bg-white p-5 shadow-xl'>
        <h3 className='text-base font-semibold'>{title}</h3>
        {description ? (
          <p className='mt-1 text-sm text-neutral-600'>{description}</p>
        ) : null}
        {children ? <div className='mt-3'>{children}</div> : null}
        <div className='mt-5 flex justify-end gap-2'>
          <button
            className='rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50'
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            className='rounded-xl px-3 py-1.5 text-sm font-semibold text-white bg-black hover:bg-neutral-800'
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type Props = {
  challengeId: string;
  /** Next.js client-entry constraint: function props should end with "Action" */
  onCreatedAction?: (s: ChallengeSubmission) => void; // optional
};

const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
function toPublicUrl(key?: string | null): string | null {
  if (!key) return null;
  return /^https?:\/\//i.test(key)
    ? key
    : PUBLIC_BASE
    ? `${PUBLIC_BASE}/${key}`
    : null;
}

export default function SubmissionForm({
  challengeId,
  onCreatedAction
}: Props) {
  const [platform, setPlatform] = useState('tiktok');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Submit modal
  const [confirmOpen, setConfirmOpen] = useState(false);

  const previewUrl = useMemo(() => toPublicUrl(imageKey), [imageKey]);

  async function uploadProof(file: File) {
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const { data } = await api.uploads.sign({
        category: 'challenge',
        purpose: 'media',
        ext,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size
      });
      const put = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file
      });
      if (!put.ok) throw new Error('Upload failed');
      setImageKey(data.key);
    } finally {
      setUploading(false);
    }
  }

  function handleOpenConfirm(e: React.FormEvent) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  async function doSubmit() {
    setConfirmOpen(false);
    setBusy(true);
    setErr(null);
    try {
      const payload: CreateSubmissionInput = {
        platform,
        linkUrl: linkUrl || null,
        imageKey,
        notes: notes || null
      };
      const { data } = await api.challenge.createSubmission(
        challengeId,
        payload
      );

      // notify parent (instant optimistic switch in the section)
      onCreatedAction?.(data);

      // also notify any listeners (background refresh)
      window.dispatchEvent(new CustomEvent('challenge:submission:updated'));

      // clear local inputs (optional)
      setLinkUrl('');
      setImageKey(null);
      setNotes('');
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message?: unknown }).message)
          : 'Failed to submit';
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={handleOpenConfirm} className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
          <div>
            <label className='block text-sm font-medium'>Platform</label>
            <select
              className='w-full rounded-xl border px-3 py-2'
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            >
              <option value='tiktok'>TikTok</option>
              <option value='instagram'>Instagram</option>
              <option value='youtube'>YouTube</option>
              <option value='facebook'>Facebook</option>
              <option value='x'>X / Twitter</option>
            </select>
          </div>
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium'>Link (optional)</label>
            <input
              className='w-full rounded-xl border px-3 py-2 text-neutral-900 placeholder:text-neutral-400'
              placeholder='https://...'
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
            />
            {/* neutral helper – no blue/underline */}
            {linkUrl ? (
              <div className='mt-1 text-xs text-neutral-600'>
                We’ll save the exact link above.{' '}
                <a
                  href={linkUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='no-underline text-neutral-900 hover:opacity-80'
                >
                  Open
                </a>
              </div>
            ) : null}
          </div>
        </div>

        {/* Proof image with preview + remove */}
        <div>
          <label className='block text-sm font-medium'>
            Proof image (optional)
          </label>
          <div className='mt-1 flex items-center gap-3'>
            <input
              type='file'
              accept='image/*'
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) void uploadProof(f);
              }}
              disabled={uploading}
            />
            {imageKey ? (
              <button
                type='button'
                onClick={() => setImageKey(null)}
                className='rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50'
                title='Remove image'
              >
                Remove
              </button>
            ) : null}
          </div>

          <div className='mt-3'>
            <div className='relative h-40 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50'>
              {uploading ? (
                <div className='grid h-full w-full place-items-center text-sm text-neutral-500'>
                  Uploading…
                </div>
              ) : previewUrl ? (
                <Image
                  src={previewUrl}
                  alt='Preview'
                  fill
                  sizes='(max-width:768px) 100vw, 50vw'
                  className='object-cover'
                />
              ) : (
                <div className='grid h-full w-full place-items-center text-xs text-neutral-500'>
                  No image selected
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium'>Notes (optional)</label>
          <textarea
            className='w-full rounded-xl border px-3 py-2'
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {err ? <p className='text-sm text-red-600'>{err}</p> : null}

        <div className='flex items-center gap-2'>
          <button
            type='submit'
            disabled={busy || uploading}
            className='px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50'
          >
            {busy ? 'Submitting…' : 'Submit'}
          </button>
          {uploading ? (
            <span className='text-xs text-neutral-500'>
              Please wait for the upload to finish…
            </span>
          ) : null}
        </div>
      </form>

      {/* Submit confirm modal */}
      <ConfirmModal
        open={confirmOpen}
        title='Submit your entry?'
        description='You can withdraw and submit again later if needed.'
        confirmLabel='Submit'
        cancelLabel='Cancel'
        onConfirm={doSubmit}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
