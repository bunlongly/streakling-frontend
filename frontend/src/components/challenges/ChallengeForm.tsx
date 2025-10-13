'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type {
  Challenge,
  CreateChallengeInput,
  UpdateChallengeInput
} from '@/types/challenge';
import Image from 'next/image';
import { useFlash } from '@/components/ui/useFlash';

/* ===== UI tokens (match portfolio/digital card) ===== */
const inputCls =
  'w-full card-surface rounded-xl border border-token px-3 py-2 text-[15px] ' +
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent shadow-sm';
const textareaCls = inputCls + ' align-top';
const selectCls = inputCls;
const labelCls = 'text-sm font-medium';
const sublabelCls = 'muted text-xs';
const sectionCardCls =
  'rounded-2xl border border-token bg-white/70 p-4 md:p-5 ' +
  'shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)]';
const btnBase =
  'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition';
const btnPrimary =
  btnBase +
  ' text-white bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] ' +
  'hover:brightness-110 active:brightness-95 shadow-[0_8px_24px_rgba(77,56,209,0.35)] disabled:opacity-60';
const btnOutline =
  btnBase +
  ' border border-token bg-white/70 hover:bg-white text-[var(--color-dark)]';
const btnGhost = 'text-sm underline';

/* ===== types & helpers ===== */
const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
const urlFor = (key?: string | null) =>
  key && PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;

type Img = { key: string; url: string; sortOrder?: number };

type PrizeDraft = {
  id?: string;
  rank: number;
  label?: string | null;
  amountCents?: number | null;
  notes?: string | null;
};

type Props =
  | { mode: 'create'; initial?: undefined; onSaved: (c: Challenge) => void }
  | { mode: 'edit'; initial: Challenge; onSaved: (c: Challenge) => void };

type FieldErrs = Partial<{
  title: string;
  postingUrl: string;
  deadline: string;
  goalViews: string;
  goalLikes: string;
  brandName: string;
  prizes: string;
}>;

export default function ChallengeForm(props: Props) {
  const { show, node: flash } = useFlash();
  const initial = props.mode === 'edit' ? props.initial : undefined;

  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<FieldErrs>({});

  const [title, setTitle] = useState<string>(initial?.title ?? '');
  const [description, setDescription] = useState<string>(
    initial?.description ?? ''
  );
  const [brandName, setBrandName] = useState<string>(initial?.brandName ?? '');
  const [brandLogoKey, setBrandLogoKey] = useState<string | null>(
    initial?.brandLogoKey ?? null
  );
  const [postingUrl, setPostingUrl] = useState<string>(
    initial?.postingUrl ?? ''
  );
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
    (initial?.images ?? []).slice(0, 6).map((im, idx) => ({
      key: im.key,
      url: im.url || urlFor(im.key) || '',
      sortOrder: typeof im.sortOrder === 'number' ? im.sortOrder : idx
    }))
  );

  // prizes
  const [prizes, setPrizes] = useState<PrizeDraft[]>(
    (initial?.prizes ?? []).map(p => ({
      id: p.id,
      rank: p.rank,
      label: p.label ?? '',
      amountCents: typeof p.amountCents === 'number' ? p.amountCents : null,
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
      purpose,
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
    try {
      setBusy(true);
      const img = await signAndUpload(file, 'avatar');
      setBrandLogoKey(img.key);
      show({
        kind: 'success',
        title: 'Logo uploaded',
        message: 'Your brand logo was uploaded.'
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to upload logo';
      show({ kind: 'error', title: 'Upload failed', message: msg });
    } finally {
      setBusy(false);
    }
  }

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
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
      show({
        kind: 'success',
        title: 'Uploaded',
        message: `${uploaded.length} image(s) added.`
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to upload image(s)';
      show({ kind: 'error', title: 'Upload failed', message: msg });
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

  /* ---------- simple validation ---------- */
  function validate(): boolean {
    const next: FieldErrs = {};
    if (!title.trim()) next.title = 'Title is required.';
    if (postingUrl && !/^https?:\/\/\S+$/i.test(postingUrl))
      next.postingUrl = 'Must be a valid URL.';
    if (goalViews !== '' && (typeof goalViews !== 'number' || goalViews < 0)) {
      next.goalViews = 'Goal views must be a positive number.';
    }
    if (goalLikes !== '' && (typeof goalLikes !== 'number' || goalLikes < 0)) {
      next.goalLikes = 'Goal likes must be a positive number.';
    }
    if (deadline && isNaN(Date.parse(deadline)))
      next.deadline = 'Invalid date.';
    // Prize ranks unique (also rechecked server-side)
    const ranks = new Set(prizesSorted.map(p => p.rank));
    if (ranks.size !== prizesSorted.length)
      next.prizes = 'Prize ranks must be unique.';
    setErrs(next);
    return Object.keys(next).length === 0;
  }

  // ---- submit ----
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      const firstErr =
        errs.title ||
        errs.postingUrl ||
        errs.goalViews ||
        errs.goalLikes ||
        errs.deadline ||
        errs.prizes ||
        'Please fix the highlighted fields.';
      // show AFTER computing with current validate call values
      const now = validate(); // recompute to get latest
      show({
        kind: 'error',
        title: 'Check form',
        message:
          firstErr ??
          (!now
            ? 'Please fix the highlighted fields.'
            : 'Please fix the highlighted fields.')
      });
      return;
    }

    setBusy(true);
    try {
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
          sortOrder: typeof im.sortOrder === 'number' ? im.sortOrder : i
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
              (props as { mode: 'edit'; initial: Challenge }).initial.id,
              payload as UpdateChallengeInput
            );

      show({
        kind: 'success',
        title: 'Saved',
        message: 'Your challenge has been saved.'
      });
      props.onSaved(res.data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save challenge';
      show({ kind: 'error', title: 'Save failed', message: msg });
    } finally {
      setBusy(false);
    }
  }

  /* ---------- render ---------- */
  return (
    <>
      {flash}

      <form onSubmit={onSubmit} className='grid gap-6'>
        {/* Basics */}
        <section className={sectionCardCls}>
          <h2 className='text-lg font-semibold mb-3'>Basics</h2>

          <div className='grid gap-2'>
            <label className={labelCls}>Title</label>
            <input
              className={inputCls}
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errs.title)
                  setErrs(prev => ({ ...prev, title: undefined }));
              }}
              placeholder='e.g. Summer UGC Challenge'
              required
            />
            {errs.title && <p className='text-sm text-red-600'>{errs.title}</p>}
          </div>

          <div className='grid gap-2 mt-4'>
            <label className={labelCls}>Description</label>
            <textarea
              className={textareaCls}
              rows={4}
              value={description ?? ''}
              onChange={e => setDescription(e.target.value)}
              placeholder='What are participants expected to do?'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
            <div className='grid gap-2'>
              <label className={labelCls}>Brand name</label>
              <input
                className={inputCls}
                value={brandName ?? ''}
                onChange={e => setBrandName(e.target.value)}
                placeholder='Acme Co.'
              />
            </div>
            <div className='grid gap-2'>
              <label className={labelCls}>Posting URL</label>
              <input
                className={inputCls}
                placeholder='https://www.tiktok.com/@brand/video/...'
                value={postingUrl ?? ''}
                onChange={e => {
                  setPostingUrl(e.target.value);
                  if (errs.postingUrl)
                    setErrs(prev => ({ ...prev, postingUrl: undefined }));
                }}
              />
              {errs.postingUrl && (
                <p className='text-sm text-red-600'>{errs.postingUrl}</p>
              )}
              <p className={sublabelCls}>
                Where entries will be posted (optional).
              </p>
            </div>
          </div>
        </section>

        {/* Brand */}
        <section className={sectionCardCls}>
          <h2 className='text-lg font-semibold mb-3'>Brand</h2>

          <div className='grid md:grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <label className={labelCls}>Brand logo</label>
              <input
                type='file'
                accept='image/*'
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) void pickAndUploadLogo(f);
                }}
              />
              {brandLogoKey ? (
                <div className='mt-2'>
                  <Image
                    src={urlFor(brandLogoKey) ?? ''}
                    alt='brand logo'
                    width={96}
                    height={96}
                    className='h-24 w-24 object-cover rounded-xl border border-token bg-white/60'
                  />
                </div>
              ) : null}
              <p className={sublabelCls}>Square images work best.</p>
            </div>
          </div>
        </section>

        {/* Media */}
        <section className={sectionCardCls}>
          <h2 className='text-lg font-semibold mb-3'>Media</h2>
          <div className='grid gap-2'>
            <label className={labelCls}>Challenge images (up to 6)</label>
            <input
              type='file'
              accept='image/*'
              multiple
              onChange={e => void addImages(e.target.files)}
            />
          </div>

          {images.length ? (
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3 pt-3'>
              {images.map((im, idx) => (
                <div
                  key={`${im.key}-${idx}`}
                  className='relative rounded-2xl overflow-hidden border border-token bg-white/70'
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={im.url}
                    alt='challenge'
                    className='w-full h-32 object-cover'
                  />
                  <div className='absolute top-1 right-1 flex gap-1'>
                    <button
                      type='button'
                      className='px-2 py-0.5 text-xs rounded bg-white/90 border'
                      onClick={() => moveImage(idx, -1)}
                      disabled={idx === 0}
                      title='Move up'
                    >
                      ↑
                    </button>
                    <button
                      type='button'
                      className='px-2 py-0.5 text-xs rounded bg-white/90 border'
                      onClick={() => moveImage(idx, +1)}
                      disabled={idx === images.length - 1}
                      title='Move down'
                    >
                      ↓
                    </button>
                    <button
                      type='button'
                      className='px-2 py-0.5 text-xs rounded bg-red-600 text-white'
                      onClick={() => removeImage(idx)}
                      title='Remove'
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='muted text-sm mt-2'>No images uploaded yet.</p>
          )}
          {images.length >= 6 ? (
            <p className='text-xs text-gray-600 mt-1'>Limit reached (6).</p>
          ) : null}
        </section>

        {/* Targets & Dates */}
        <section className={sectionCardCls}>
          <h2 className='text-lg font-semibold mb-3'>Targets & Deadline</h2>

          <div className='grid gap-2'>
            <label className={labelCls}>Target platforms</label>
            <input
              className={inputCls}
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
            <p className={sublabelCls}>Comma-separated list.</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
            <div className='grid gap-2'>
              <label className={labelCls}>Goal views</label>
              <input
                type='number'
                className={inputCls}
                value={goalViews}
                onChange={e =>
                  setGoalViews(e.target.value ? Number(e.target.value) : '')
                }
                min={0}
              />
              {errs.goalViews && (
                <p className='text-sm text-red-600'>{errs.goalViews}</p>
              )}
            </div>
            <div className='grid gap-2'>
              <label className={labelCls}>Goal likes</label>
              <input
                type='number'
                className={inputCls}
                value={goalLikes}
                onChange={e =>
                  setGoalLikes(e.target.value ? Number(e.target.value) : '')
                }
                min={0}
              />
              {errs.goalLikes && (
                <p className='text-sm text-red-600'>{errs.goalLikes}</p>
              )}
            </div>
            <div className='grid gap-2'>
              <label className={labelCls}>Deadline</label>
              <input
                type='date'
                className={inputCls}
                value={deadline}
                onChange={e => {
                  setDeadline(e.target.value);
                  if (errs.deadline)
                    setErrs(prev => ({ ...prev, deadline: undefined }));
                }}
              />
              {errs.deadline && (
                <p className='text-sm text-red-600'>{errs.deadline}</p>
              )}
            </div>
          </div>

          <div className='grid gap-2 mt-4'>
            <label className={labelCls}>Publish status</label>
            <select
              className={selectCls}
              value={publishStatus}
              onChange={e =>
                setPublishStatus(e.target.value as typeof publishStatus)
              }
            >
              <option value='DRAFT'>Draft</option>
              <option value='PRIVATE'>Private</option>
              <option value='PUBLISHED'>Published</option>
            </select>
          </div>
        </section>

        {/* Prizes */}
        <section className={sectionCardCls}>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold'>Prizes</h2>
            <button
              type='button'
              onClick={addPrize}
              disabled={prizes.length >= maxPrizes}
              className={btnOutline}
            >
              + Add prize
            </button>
          </div>

          {errs.prizes && (
            <p className='text-sm text-red-600 mt-2'>{errs.prizes}</p>
          )}

          {prizesSorted.length === 0 ? (
            <p className='muted text-sm mt-3'>No prizes added.</p>
          ) : (
            <div className='space-y-3 mt-4'>
              {prizesSorted.map((p, idx) => {
                const dollars =
                  typeof p.amountCents === 'number'
                    ? (p.amountCents / 100).toString()
                    : '';
                return (
                  <div
                    key={`${p.id ?? 'new'}-${p.rank}-${idx}`}
                    className='rounded-2xl border border-token p-3 bg-white/70'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='text-sm opacity-80'>Rank #{p.rank}</div>
                      <div className='flex gap-2'>
                        <button
                          type='button'
                          className={btnGhost}
                          onClick={() => movePrize(idx, -1)}
                          disabled={idx === 0}
                          title='Move up'
                        >
                          Up
                        </button>
                        <button
                          type='button'
                          className={btnGhost}
                          onClick={() => movePrize(idx, +1)}
                          disabled={idx === prizesSorted.length - 1}
                          title='Move down'
                        >
                          Down
                        </button>
                        <button
                          type='button'
                          className={`${btnGhost} text-red-600`}
                          onClick={() => removePrize(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className='mt-2 grid grid-cols-1 md:grid-cols-4 gap-2'>
                      <div className='grid gap-1'>
                        <label className='text-xs font-medium'>Rank</label>
                        <input
                          type='number'
                          min={1}
                          className={inputCls}
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
                      <div className='grid gap-1'>
                        <label className='text-xs font-medium'>Label</label>
                        <input
                          className={inputCls}
                          placeholder='Gold / 1st place…'
                          value={p.label ?? ''}
                          onChange={e =>
                            updatePrizeField(idx, 'label', e.target.value)
                          }
                        />
                      </div>
                      <div className='grid gap-1'>
                        <label className='text-xs font-medium'>
                          Amount (USD)
                        </label>
                        <input
                          type='number'
                          min={0}
                          step='0.01'
                          className={inputCls}
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
                      <div className='grid gap-1'>
                        <label className='text-xs font-medium'>Notes</label>
                        <input
                          className={inputCls}
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

          <p className='text-xs text-gray-500 mt-2'>
            Tip: ranks should be unique; the form normalizes order on save.
          </p>
        </section>

        {/* Actions */}
        <div className='flex justify-end'>
          <button type='submit' disabled={busy} className={btnPrimary}>
            {busy
              ? 'Saving…'
              : props.mode === 'create'
              ? 'Create Challenge'
              : 'Save Changes'}
          </button>
        </div>
      </form>
    </>
  );
}
