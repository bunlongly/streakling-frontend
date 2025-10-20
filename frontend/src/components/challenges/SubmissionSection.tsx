'use client';

import { useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import MagicBorder from '@/components/ui/MagicBorder';
import SubmissionForm from './SubmissionForm';

/* MUI icons for nicer social/account badges */
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import YouTubeIcon from '@mui/icons-material/YouTube';
import GitHubIcon from '@mui/icons-material/GitHub';
import AudiotrackIcon from '@mui/icons-material/Audiotrack'; // TikTok-ish
import SendIcon from '@mui/icons-material/Send'; // Telegram-ish
import LanguageIcon from '@mui/icons-material/Language';
import LinkIcon from '@mui/icons-material/Link';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import type { ChallengeSubmission } from '@/types/challenge';

type Submission = {
  id: string;
  platform: string;
  linkUrl: string | null;
  imageKey: string | null;
  notes: string | null;
  submissionOrder: number;
  status: string;
  submitterName: string | null;
  submitterPhone: string | null;
  submitterSocials: Array<{
    platform: string;
    handle?: string | null;
    url?: string | null;
    label?: string | null;
  }>;
  createdAt: string; // ISO
};

/* ---------- Small, local modal ---------- */
function ConfirmModal(props: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
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
    danger,
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
            className={[
              'rounded-xl px-3 py-1.5 text-sm font-semibold text-white',
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-black hover:bg-neutral-800'
            ].join(' ')}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
function toPublicUrl(key?: string | null): string | null {
  if (!key) return null;
  return /^https?:\/\//i.test(key)
    ? key
    : PUBLIC_BASE
    ? `${PUBLIC_BASE}/${key}`
    : null;
}

function platformMuiIcon(name?: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('twitter') || n === 'x')
    return <TwitterIcon fontSize='inherit' />;
  if (n.includes('instagram')) return <InstagramIcon fontSize='inherit' />;
  if (n.includes('facebook')) return <FacebookIcon fontSize='inherit' />;
  if (n.includes('linkedin')) return <LinkedInIcon fontSize='inherit' />;
  if (n.includes('youtube')) return <YouTubeIcon fontSize='inherit' />;
  if (n.includes('github')) return <GitHubIcon fontSize='inherit' />;
  if (n.includes('tiktok')) return <AudiotrackIcon fontSize='inherit' />;
  if (n.includes('telegram')) return <SendIcon fontSize='inherit' />;
  if (n.includes('phone')) return <PhoneIcon fontSize='inherit' />;
  if (n.includes('site') || n.includes('web'))
    return <LanguageIcon fontSize='inherit' />;
  return <LinkIcon fontSize='inherit' />;
}

/** Narrowly typed guard to avoid `any` */
function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message: unknown }).message === 'string'
  );
}

/** Adapt backend type → local UI type (normalizes undefined → null) */
function adaptToLocal(s: ChallengeSubmission): Submission {
  return {
    id: s.id,
    platform: s.platform,
    linkUrl: s.linkUrl ?? null,
    imageKey: s.imageKey ?? null,
    notes: s.notes ?? null,
    submissionOrder: s.submissionOrder ?? 0,
    status: String(s.status ?? 'SUBMITTED'),
    submitterName: s.submitterName ?? null,
    submitterPhone: s.submitterPhone ?? null,
    submitterSocials: Array.isArray(s.submitterSocials)
      ? s.submitterSocials
      : [],
    createdAt: s.createdAt ?? new Date().toISOString()
  };
}

export default function SubmissionSection({
  challengeId
}: {
  challengeId: string;
}) {
  const [mine, setMine] = useState<Submission | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Withdraw modal
  const [confirmWithdrawOpen, setConfirmWithdrawOpen] = useState(false);
  const withdrawingRef = useRef(false);

  const safeGetMessage = (e: unknown) => (hasMessage(e) ? e.message : '');

  const fetchMine = useCallback(async () => {
    try {
      const res = await api.challenge.getMySubmission(challengeId);
      setMine(res.data ? adaptToLocal(res.data as ChallengeSubmission) : null);
      setErr(null);
    } catch (e: unknown) {
      const m = safeGetMessage(e);
      if (!String(m).toLowerCase().includes('not submitted')) {
        setErr(m || 'Failed to load submission');
      }
      setMine(null);
    }
  }, [challengeId]);

  const backgroundRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchMine();
    } finally {
      setRefreshing(false);
    }
  }, [fetchMine]);

  // Initial load (no flash on subsequent refreshes)
  useEffect(() => {
    let active = true;
    (async () => {
      setInitialLoading(true);
      await fetchMine();
      if (active) setInitialLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchMine]);

  // Listen for a lightweight custom event from the form
  useEffect(() => {
    const onUpdated = () => {
      void backgroundRefresh();
    };
    window.addEventListener('challenge:submission:updated', onUpdated);
    return () =>
      window.removeEventListener('challenge:submission:updated', onUpdated);
  }, [backgroundRefresh]);

  function openWithdrawModal() {
    if (withdrawingRef.current) return;
    setConfirmWithdrawOpen(true);
  }

  async function confirmWithdraw() {
    if (withdrawingRef.current) return;
    withdrawingRef.current = true;
    setConfirmWithdrawOpen(false);
    setErr(null);

    // optimistic clear
    const prev = mine;
    setMine(null);

    try {
      await api.challenge.withdrawSubmission(challengeId);
      await backgroundRefresh();
      window.dispatchEvent(new CustomEvent('challenge:submission:updated'));
    } catch (e: unknown) {
      setMine(prev);
      setErr(safeGetMessage(e) || 'Failed to withdraw');
    } finally {
      withdrawingRef.current = false;
    }
  }

  // Called by the form on success (non-async to satisfy onCreatedAction: (s) => void)
  const handleCreated = useCallback(
    (next: ChallengeSubmission) => {
      setMine(adaptToLocal(next)); // optimistic set
      void backgroundRefresh(); // confirm in background
    },
    [backgroundRefresh]
  );

  const RefreshBadge = refreshing ? (
    <span className='ml-2 text-[11px] text-neutral-500'>syncing…</span>
  ) : null;

  if (initialLoading) {
    return (
      <MagicBorder radius='rounded-2xl' className='shadow-none'>
        <div className='rounded-2xl bg-white p-4 text-sm text-neutral-600'>
          Checking your submission…
        </div>
      </MagicBorder>
    );
  }

  if (err && !mine) {
    return (
      <MagicBorder radius='rounded-2xl' className='shadow-none'>
        <div className='rounded-2xl bg-white p-4 text-sm text-red-600'>
          {err}
        </div>
      </MagicBorder>
    );
  }

  if (!mine) {
    return (
      <MagicBorder radius='rounded-2xl' className='shadow-none'>
        <div className='rounded-2xl bg-white p-5'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h2 className='text-base font-semibold'>
                Submit your entry {RefreshBadge}
              </h2>
              <p className='mt-1 text-sm text-neutral-600'>
                Share your link or upload proof. You can withdraw and resubmit
                later if needed.
              </p>
            </div>
            <div className='hidden sm:block rounded-full px-2.5 py-1 text-[11px] font-semibold text-white bg-[linear-gradient(120deg,#7b39e8_0%,#2d69ea_55%,#10a991_100%)]'>
              New
            </div>
          </div>

          <div className='mt-4'>
            <SubmissionForm
              challengeId={challengeId}
              onCreatedAction={handleCreated}
            />
          </div>
        </div>
      </MagicBorder>
    );
  }

  const imgUrl = toPublicUrl(mine.imageKey);

  return (
    <>
      <MagicBorder radius='rounded-2xl' className='shadow-none'>
        <div className='rounded-2xl bg-white p-5'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h2 className='text-base font-semibold'>
                Your submission {RefreshBadge}
              </h2>
              <p className='mt-1 text-sm text-neutral-600'>
                View your details below. You may withdraw to resubmit later.
              </p>
            </div>

            <button
              onClick={openWithdrawModal}
              className='inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 active:bg-red-100 disabled:opacity-50 transition'
              title='Withdraw submission'
            >
              Withdraw
            </button>
          </div>

          <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3'>
            {/* Left: key facts */}
            <div className='rounded-xl border border-neutral-200 p-3 text-sm text-neutral-800'>
              <div className='flex items-center gap-2'>
                <PersonIcon fontSize='small' className='text-neutral-500' />
                <span>
                  Platform: <span className='font-medium'>{mine.platform}</span>
                </span>
              </div>
              <div className='mt-1'>
                Status: <span className='font-medium'>{mine.status}</span>
              </div>
              <div className='mt-1'>
                Order:{' '}
                <span className='font-medium'>#{mine.submissionOrder}</span>
              </div>
              <div className='mt-1'>
                Submitted: {mine.createdAt.slice(0, 19).replace('T', ' ')}
              </div>
            </div>

            {/* Middle: link + notes, neutral styling (no blue/underline) */}
            <div className='rounded-xl border border-neutral-200 p-3 text-sm text-neutral-800'>
              {mine.linkUrl ? (
                <div className='truncate'>
                  Link:{' '}
                  <a
                    className='font-medium text-neutral-900 no-underline hover:opacity-80 break-all'
                    href={mine.linkUrl}
                    target='_blank'
                    rel='noreferrer'
                    title='Open submitted link'
                  >
                    {mine.linkUrl}
                  </a>
                </div>
              ) : (
                <div className='text-neutral-500'>No link provided</div>
              )}
              {mine.notes ? (
                <div className='mt-2 text-neutral-700'>Notes: {mine.notes}</div>
              ) : null}
            </div>

            {/* Right: image proof preview */}
            <div className='rounded-xl border border-neutral-200 p-3'>
              <div className='text-sm font-medium text-neutral-800'>
                Proof image
              </div>
              <div className='mt-2 relative h-40 w-full overflow-hidden rounded-lg bg-neutral-50'>
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt='Submitted proof'
                    fill
                    sizes='(max-width: 768px) 100vw, 33vw'
                    className='object-cover'
                  />
                ) : (
                  <div className='grid h-full w-full place-items-center text-xs text-neutral-500'>
                    No image
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submitter info + socials */}
          <div className='mt-4 rounded-xl border border-neutral-200 p-3 text-sm text-neutral-800'>
            <div className='flex flex-wrap items-center gap-x-4 gap-y-1'>
              {mine.submitterName && (
                <div className='flex items-center gap-2'>
                  <PersonIcon fontSize='small' className='text-neutral-500' />
                  <span>
                    Name:{' '}
                    <span className='font-medium'>{mine.submitterName}</span>
                  </span>
                </div>
              )}
              {mine.submitterPhone && (
                <div className='flex items-center gap-2'>
                  <PhoneIcon fontSize='small' className='text-neutral-500' />
                  <span>
                    Phone:{' '}
                    <span className='font-medium'>{mine.submitterPhone}</span>
                  </span>
                </div>
              )}
            </div>

            {mine.submitterSocials?.length ? (
              <>
                <div className='h-px my-3 bg-neutral-200' />
                <div className='flex flex-wrap gap-2'>
                  {mine.submitterSocials.map((s, idx) => {
                    const text = s.label || s.handle || s.platform;
                    const href =
                      s.url ??
                      (s.handle
                        ? `https://t.me/${s.handle.replace(/^@/, '')}`
                        : null);
                    const Icon = platformMuiIcon(s.platform);

                    const Badge = (
                      <span className='inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50'>
                        <span
                          className='inline-flex items-center justify-center'
                          style={{ fontSize: 14 }}
                        >
                          {Icon}
                        </span>
                        {text}
                      </span>
                    );

                    return href ? (
                      <a
                        key={idx}
                        href={href}
                        target='_blank'
                        rel='noreferrer'
                        className='group'
                      >
                        {Badge}
                      </a>
                    ) : (
                      <span key={idx}>{Badge}</span>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </MagicBorder>

      {/* Withdraw modal */}
      <ConfirmModal
        open={confirmWithdrawOpen}
        title='Withdraw submission?'
        description='This will remove your current submission. You can submit again later.'
        confirmLabel='Withdraw'
        cancelLabel='Keep'
        danger
        onConfirm={confirmWithdraw}
        onClose={() => setConfirmWithdrawOpen(false)}
      />
    </>
  );
}
