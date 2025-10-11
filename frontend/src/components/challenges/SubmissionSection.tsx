// src/components/challenges/SubmissionSection.tsx
'use client';

import { useEffect, useState } from 'react';
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

export default function SubmissionSection({
  challengeId
}: {
  challengeId: string;
}) {
  const [mine, setMine] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.challenge.getMySubmission(challengeId); // GET /challenges/:id/submissions?mine=1
      setMine((res.data ?? null) as Submission | null);
    } catch (e: any) {
      const m = e?.message ?? '';
      // treat "not submitted" as empty
      if (!String(m).toLowerCase().includes('not submitted')) {
        setErr(m || 'Failed to load submission');
      }
      setMine(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [challengeId]);

  async function withdraw() {
    if (!confirm('Withdraw your submission? This cannot be undone.')) return;
    setWithdrawing(true);
    setErr(null);
    try {
      await api.challenge.withdrawSubmission(challengeId); // DELETE /challenges/:id/submissions
      await refresh();
    } catch (e: any) {
      setErr(e?.message || 'Failed to withdraw');
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return (
      <MagicBorder radius='rounded-2xl' className='shadow-none'>
        <div className='rounded-2xl bg-white p-4 text-sm text-neutral-600'>
          Checking your submission…
        </div>
      </MagicBorder>
    );
  }

  if (err) {
    return (
      <MagicBorder radius='rounded-2xl' className='shadow-none'>
        <div className='rounded-2xl bg-white p-4 text-sm text-red-600'>
          {err}
        </div>
      </MagicBorder>
    );
  }

  if (!mine) {
    // Empty state: invite to submit
    return (
      <MagicBorder radius='rounded-2xl' className='shadow-none'>
        <div className='rounded-2xl bg-white p-5'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h2 className='text-base font-semibold'>Submit your entry</h2>
              <p className='mt-1 text-sm text-neutral-600'>
                Share your link or upload proof. You can edit or withdraw later
                if needed.
              </p>
            </div>
            <div className='hidden sm:block rounded-full px-2.5 py-1 text-[11px] font-semibold text-white bg-[linear-gradient(120deg,#7b39e8_0%,#2d69ea_55%,#10a991_100%)]'>
              New
            </div>
          </div>

          <div className='mt-4'>
            <SubmissionForm challengeId={challengeId} onSubmitted={refresh} />
          </div>
        </div>
      </MagicBorder>
    );
  }

  // Submitted state
  return (
    <MagicBorder radius='rounded-2xl' className='shadow-none'>
      <div className='rounded-2xl bg-white p-5'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <h2 className='text-base font-semibold'>Your submission</h2>
            <p className='mt-1 text-sm text-neutral-600'>
              View your details below. You may withdraw if you want to resubmit
              later.
            </p>
          </div>

          <button
            onClick={withdraw}
            disabled={withdrawing}
            className='
              inline-flex items-center justify-center rounded-full
              px-3 py-1.5 text-sm font-semibold
              border border-red-200 text-red-600
              hover:bg-red-50 active:bg-red-100
              disabled:opacity-50
              transition
            '
            title='Withdraw submission'
          >
            {withdrawing ? 'Withdrawing…' : 'Withdraw'}
          </button>
        </div>

        <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-neutral-800'>
          <div className='rounded-xl border border-neutral-200 p-3 space-y-1'>
            <div className='flex items-center gap-2'>
              <PersonIcon fontSize='small' className='text-neutral-500' />
              <span>
                Platform: <span className='font-medium'>{mine.platform}</span>
              </span>
            </div>
            <div>
              Status: <span className='font-medium'>{mine.status}</span>
            </div>
            <div>
              Order:{' '}
              <span className='font-medium'>#{mine.submissionOrder}</span>
            </div>
            <div>
              Submitted at: {mine.createdAt.slice(0, 19).replace('T', ' ')}
            </div>
          </div>

          <div className='rounded-xl border border-neutral-200 p-3 space-y-2'>
            {mine.linkUrl ? (
              <div className='truncate'>
                Link:{' '}
                <a
                  className='text-[#2d69ea] underline break-all'
                  href={mine.linkUrl}
                  target='_blank'
                  rel='noreferrer'
                >
                  {mine.linkUrl}
                </a>
              </div>
            ) : (
              <div className='text-neutral-600'>No link provided</div>
            )}
            {mine.notes ? (
              <div className='text-neutral-700'>Notes: {mine.notes}</div>
            ) : null}
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
                    <span
                      className='
                        inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full
                        border border-neutral-200 bg-white hover:bg-neutral-50
                      '
                    >
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
  );
}
