'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type {
  CreateSubmissionInput,
  ChallengeSubmission
} from '@/types/challenge';

type Props = {
  challengeId: string;
  onCreated?: (s: ChallengeSubmission) => void; // optional
};

export default function SubmissionForm({ challengeId, onCreated }: Props) {
  const [platform, setPlatform] = useState('tiktok');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function uploadProof(file: File) {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const { data } = await api.uploads.sign({
      category: 'challenge',
      purpose: 'media', // ✅ allowed by backend
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
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
      onCreated?.(data);

      // clear
      setLinkUrl('');
      setImageKey(null);
      setNotes('');
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e && 'message' in e
          ? String((e as { message?: unknown }).message)
          : 'Failed to submit';
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className='space-y-3'>
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
          </select>
        </div>
        <div className='md:col-span-2'>
          <label className='block text-sm font-medium'>Link (optional)</label>
          <input
            className='w-full rounded-xl border px-3 py-2'
            placeholder='https://...'
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium'>
          Proof image (optional)
        </label>
        <input
          type='file'
          accept='image/*'
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) void uploadProof(f);
          }}
        />
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
      <button
        type='submit'
        disabled={busy}
        className='px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50'
      >
        {busy ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  );
}
