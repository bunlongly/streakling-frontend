'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type {
  Challenge,
  CreateChallengeInput,
  UpdateChallengeInput
} from '@/types/challenge';
import Image from 'next/image';

const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
const urlFor = (key?: string | null) =>
  key && PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;

type Img = { key: string; url: string; sortOrder?: number };

type PrizeDraft = {
  id?: string; // only present when editing an existing prize; backend ignores on update
  rank: number;
  label?: string | null;
  amountCents?: number | null;
  notes?: string | null;
};

type Props =
  | { mode: 'create'; initial?: undefined; onSaved: (c: Challenge) => void }
  | { mode: 'edit'; initial: Challenge; onSaved: (c: Challenge) => void };

export default function ChallengeForm(props: Props) {
  const initial = props.mode === 'edit' ? props.initial : undefined;

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [brandName, setBrandName] = useState(initial?.brandName ?? '');
  const [brandLogoKey, setBrandLogoKey] = useState<string | null>(
    initial?.brandLogoKey ?? null
  );
  const [postingUrl, setPostingUrl] = useState(initial?.postingUrl ?? '');
  const [platforms, setPlatforms] = useState<string[]>(
    Array.isArray(initial?.targetPlatforms)
      ? (initial!.targetPlatforms as string[])
      : []
  );
  const [goalViews, setGoalViews] = useState<number | ''>(
    initial?.goalViews ?? ''
  );
  const [goalLikes, setGoalLikes] = useState<number | ''>(
    initial?.goalLikes ?? ''
  );
  const [deadline, setDeadline] = useState<string>(
    initial?.deadline?.slice(0, 10) ?? ''
  );
  const [publishStatus, setPublishStatus] = useState<
    'DRAFT' | 'PRIVATE' | 'PUBLISHED'
  >(initial?.publishStatus ?? 'DRAFT');

  // images (limit 6)
  const [images, setImages] = useState<Img[]>(
    (initial?.images ?? []).slice(0, 6).map((im: any, idx: number) => ({
      key: im.key,
      url: im.url || urlFor(im.key) || '',
      sortOrder: typeof im.sortOrder === 'number' ? im.sortOrder : idx
    }))
  );

  // ---- prizes ----
  const [prizes, setPrizes] = useState<PrizeDraft[]>(
    (initial?.prizes ?? []).map(p => ({
      id: p.id,
      rank: p.rank,
      label: p.label ?? '',
      amountCents:
        typeof p.amountCents === 'number' ? p.amountCents : (undefined as any),
      notes: p.notes ?? ''
    }))
  );

  const maxPrizes = 10;

  function addPrize() {
    setPrizes(ps => {
      const nextRank = ps.length > 0 ? Math.max(...ps.map(p => p.rank)) + 1 : 1;
      if (ps.length >= maxPrizes) return ps;
      return [
        ...ps,
        { rank: nextRank, label: '', amountCents: null, notes: '' }
      ];
    });
  }

  function removePrize(idx: number) {
    setPrizes(ps => {
      const next = ps.filter((_, i) => i !== idx);
      // re-sequence ranks to 1..n
      return next
        .sort((a, b) => a.rank - b.rank)
        .map((p, i) => ({ ...p, rank: i + 1 }));
    });
  }

  function movePrize(idx: number, dir: -1 | 1) {
    setPrizes(ps => {
      const j = idx + dir;
      if (j < 0 || j >= ps.length) return ps;
      const next = ps.slice().sort((a, b) => a.rank - b.rank);
      [next[idx], next[j]] = [next[j], next[idx]];
      // normalize ranks
      return next.map((p, i) => ({ ...p, rank: i + 1 }));
    });
  }

  function updatePrizeField<T extends keyof PrizeDraft>(
    idx: number,
    field: T,
    value: PrizeDraft[T]
  ) {
    setPrizes(ps => {
      const next = ps.slice();
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  const prizesSorted = useMemo(
    () => prizes.slice().sort((a, b) => a.rank - b.rank),
    [prizes]
  );

  // ---- uploads ----
  async function signAndUpload(
    file: File,
    purpose: 'media' | 'avatar'
  ): Promise<Img> {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const { data } = await api.uploads.sign({
      category: 'challenge',
      purpose, // 'media' for gallery, 'avatar' for brand logo
      ext,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size
    });
    const put = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file
    });
    if (!put.ok)
      throw new Error(`Upload failed: ${put.status} ${put.statusText}`);
    return {
      key: data.key,
      url: data.url || urlFor(data.key) || '',
      sortOrder: 0
    };
  }

  async function pickAndUploadLogo(file: File) {
    const img = await signAndUpload(file, 'avatar');
    setBrandLogoKey(img.key);
  }

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    try {
      const remaining = Math.max(0, 6 - images.length);
      const slice = Array.from(files).slice(0, remaining);
      const uploaded = await Promise.all(
        slice.map(f => signAndUpload(f, 'media'))
      );
      const next = [...images, ...uploaded]
        .slice(0, 6)
        .map((im, i) => ({ ...im, sortOrder: i }));
      setImages(next);
    } catch (e: any) {
      setErr(e?.message || 'Failed to upload image(s)');
    } finally {
      setBusy(false);
    }
  }

  function removeImage(idx: number) {
    const next = images
      .filter((_, i) => i !== idx)
      .map((im, i) => ({ ...im, sortOrder: i }));
    setImages(next);
  }

  function moveImage(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= images.length) return;
    const next = images.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    setImages(next.map((im, i) => ({ ...im, sortOrder: i })));
  }

  // ---- submit ----
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      // basic client-side guard: ranks unique + sequential
      const ranks = new Set(prizesSorted.map(p => p.rank));
      if (ranks.size !== prizesSorted.length) {
        throw new Error('Prize ranks must be unique.');
      }

      const payload: CreateChallengeInput | UpdateChallengeInput = {
        title,
        description: description || null,
        brandName: brandName || null,
        brandLogoKey,
        postingUrl: postingUrl || null,
        targetPlatforms: platforms.length ? platforms : null,
        goalViews: typeof goalViews === 'number' ? goalViews : null,
        goalLikes: typeof goalLikes === 'number' ? goalLikes : null,
        deadline: deadline || null,
        publishStatus,
        images: images.map((im, i) => ({
          key: im.key,
          url: im.url,
          sortOrder: typeof im.sortOrder === 'number' ? im.sortOrder! : i
        })),
        prizes:
          prizesSorted.length > 0
            ? prizesSorted.map(p => ({
                rank: p.rank,
                label: p.label?.trim() || null,
                amountCents:
                  typeof p.amountCents === 'number' &&
                  !Number.isNaN(p.amountCents)
                    ? p.amountCents
                    : null,
                notes: p.notes?.trim() || null
              }))
            : null
      };

      const res =
        props.mode === 'create'
          ? await api.challenge.create(payload as CreateChallengeInput)
          : await api.challenge.updateById(
              initial!.id,
              payload as UpdateChallengeInput
            );

      props.onSaved(res.data);
    } catch (e: any) {
      setErr(e?.message || 'Failed to save challenge');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className='space-y-6'>
      <div>
        <label className='block text-sm font-medium'>Title</label>
        <input
          className='w-full rounded-xl border px-3 py-2'
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className='block text-sm font-medium'>Description</label>
        <textarea
          className='w-full rounded-xl border px-3 py-2'
          rows={4}
          value={description ?? ''}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium'>Brand name</label>
          <input
            className='w-full rounded-xl border px-3 py-2'
            value={brandName ?? ''}
            onChange={e => setBrandName(e.target.value)}
          />
        </div>
        <div>
          <label className='block text-sm font-medium'>Posting URL</label>
          <input
            className='w-full rounded-xl border px-3 py-2'
            placeholder='https://www.tiktok.com/@brand/video/...'
            value={postingUrl ?? ''}
            onChange={e => setPostingUrl(e.target.value)}
          />
        </div>
      </div>

      {/* Brand logo */}
      <div className='space-y-2'>
        <label className='block text-sm font-medium'>Brand logo</label>
        <input
          type='file'
          accept='image/*'
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) void pickAndUploadLogo(f);
          }}
        />
        {brandLogoKey ? (
          <Image
            src={urlFor(brandLogoKey) ?? ''}
            alt='brand logo'
            width={96}
            height={96}
            className='h-24 w-24 object-cover rounded-lg border'
          />
        ) : null}
      </div>

      {/* Challenge images (up to 6) */}
      <div className='space-y-2'>
        <label className='block text-sm font-medium'>Images (up to 6)</label>
        <input
          type='file'
          accept='image/*'
          multiple
          onChange={e => void addImages(e.target.files)}
        />
        {images.length ? (
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3 pt-2'>
            {images.map((im, idx) => (
              <div key={`${im.key}-${idx}`} className='relative'>
                <img
                  src={im.url}
                  alt='challenge'
                  className='w-full h-32 object-cover rounded-xl border'
                />
                <div className='absolute top-1 right-1 flex gap-1'>
                  <button
                    type='button'
                    className='px-2 py-0.5 text-xs rounded bg-white/90 border'
                    onClick={() => moveImage(idx, -1)}
                    disabled={idx === 0}
                  >
                    ↑
                  </button>
                  <button
                    type='button'
                    className='px-2 py-0.5 text-xs rounded bg-white/90 border'
                    onClick={() => moveImage(idx, +1)}
                    disabled={idx === images.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type='button'
                    className='px-2 py-0.5 text-xs rounded bg-red-600 text-white'
                    onClick={() => removeImage(idx)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {images.length >= 6 ? (
          <p className='text-xs text-gray-500'>Limit reached (6).</p>
        ) : null}
      </div>

      {/* Platforms */}
      <div>
        <label className='block text-sm font-medium'>Target platforms</label>
        <input
          className='w-full rounded-xl border px-3 py-2'
          placeholder='tiktok, instagram, youtube'
          value={platforms.join(', ')}
          onChange={e =>
            setPlatforms(
              e.target.value
                .split(',')
                .map(s => s.trim().toLowerCase())
                .filter(Boolean)
            )
          }
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div>
          <label className='block text-sm font-medium'>Goal views</label>
          <input
            type='number'
            className='w-full rounded-xl border px-3 py-2'
            value={goalViews}
            onChange={e =>
              setGoalViews(e.target.value ? Number(e.target.value) : '')
            }
            min={0}
          />
        </div>
        <div>
          <label className='block text-sm font-medium'>Goal likes</label>
          <input
            type='number'
            className='w-full rounded-xl border px-3 py-2'
            value={goalLikes}
            onChange={e =>
              setGoalLikes(e.target.value ? Number(e.target.value) : '')
            }
            min={0}
          />
        </div>
        <div>
          <label className='block text-sm font-medium'>Deadline</label>
          <input
            type='date'
            className='w-full rounded-xl border px-3 py-2'
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium'>Publish status</label>
        <select
          className='w-full rounded-xl border px-3 py-2'
          value={publishStatus}
          onChange={e =>
            setPublishStatus(e.target.value as typeof publishStatus)
          }
        >
          <option value='DRAFT'>DRAFT</option>
          <option value='PRIVATE'>PRIVATE</option>
          <option value='PUBLISHED'>PUBLISHED</option>
        </select>
      </div>

      {/* -------- PRIZES UI -------- */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <label className='block text-sm font-semibold'>Prizes</label>
          <button
            type='button'
            onClick={addPrize}
            disabled={prizes.length >= maxPrizes}
            className='text-sm px-3 py-1.5 rounded-lg border disabled:opacity-50'
          >
            + Add prize
          </button>
        </div>

        {prizesSorted.length === 0 ? (
          <p className='text-sm text-gray-500'>No prizes added.</p>
        ) : (
          <div className='space-y-2'>
            {prizesSorted.map((p, idx) => {
              // Present amount as dollars for UX; store/submit as cents
              const dollars =
                typeof p.amountCents === 'number'
                  ? (p.amountCents / 100).toString()
                  : '';

              return (
                <div
                  key={`${p.id ?? 'new'}-${p.rank}-${idx}`}
                  className='rounded-xl border p-3 space-y-2'
                >
                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-gray-600'>Rank #{p.rank}</div>
                    <div className='flex gap-1'>
                      <button
                        type='button'
                        className='px-2 py-0.5 text-xs rounded border'
                        onClick={() => movePrize(idx, -1)}
                        disabled={idx === 0}
                      >
                        ↑
                      </button>
                      <button
                        type='button'
                        className='px-2 py-0.5 text-xs rounded border'
                        onClick={() => movePrize(idx, +1)}
                        disabled={idx === prizesSorted.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type='button'
                        className='px-2 py-0.5 text-xs rounded bg-red-600 text-white'
                        onClick={() => removePrize(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                    <div className='md:col-span-1'>
                      <label className='block text-xs text-gray-600'>
                        Rank
                      </label>
                      <input
                        type='number'
                        min={1}
                        className='w-full rounded-lg border px-3 py-2'
                        value={p.rank}
                        onChange={e =>
                          updatePrizeField(
                            idx,
                            'rank',
                            Math.max(1, Number(e.target.value || 1))
                          )
                        }
                      />
                    </div>
                    <div className='md:col-span-1'>
                      <label className='block text-xs text-gray-600'>
                        Label
                      </label>
                      <input
                        className='w-full rounded-lg border px-3 py-2'
                        placeholder='Gold / 1st place…'
                        value={p.label ?? ''}
                        onChange={e =>
                          updatePrizeField(idx, 'label', e.target.value)
                        }
                      />
                    </div>
                    <div className='md:col-span-1'>
                      <label className='block text-xs text-gray-600'>
                        Amount (USD)
                      </label>
                      <input
                        type='number'
                        min={0}
                        step='0.01'
                        className='w-full rounded-lg border px-3 py-2'
                        placeholder='e.g. 100.00'
                        value={dollars}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === '') {
                            updatePrizeField(idx, 'amountCents', null);
                          } else {
                            const cents = Math.round(Number(v) * 100);
                            updatePrizeField(
                              idx,
                              'amountCents',
                              Number.isFinite(cents) ? cents : null
                            );
                          }
                        }}
                      />
                    </div>
                    <div className='md:col-span-1'>
                      <label className='block text-xs text-gray-600'>
                        Notes
                      </label>
                      <input
                        className='w-full rounded-lg border px-3 py-2'
                        placeholder='optional'
                        value={p.notes ?? ''}
                        onChange={e =>
                          updatePrizeField(idx, 'notes', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className='text-xs text-gray-500'>
          Tip: ranks should be unique; the form will normalize order when you
          save.
        </p>
      </div>
      {/* -------- END PRIZES UI -------- */}

      {err ? <p className='text-sm text-red-600'>{err}</p> : null}

      <div>
        <button
          type='submit'
          disabled={busy}
          className='px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50'
        >
          {busy
            ? 'Saving…'
            : props.mode === 'create'
            ? 'Create challenge'
            : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
