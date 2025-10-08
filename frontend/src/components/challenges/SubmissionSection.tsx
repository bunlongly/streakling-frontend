'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import SubmissionForm from './SubmissionForm';

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
  submitterSocials: Array<{ platform: string; handle?: string | null; url?: string | null; label?: string | null }>;
  createdAt: string;
};

export default function SubmissionSection({ challengeId }: { challengeId: string }) {
  const [mine, setMine] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.challenge.getMySubmission(challengeId); // calls GET /challenges/:id/submissions?mine=1
      setMine(res.data ?? null);
    } catch (e: any) {
      // treat 404 "Not submitted" as no submission
      const m = e?.message ?? '';
      if (!String(m).toLowerCase().includes('not submitted')) setErr(m || 'Failed to load submission');
      setMine(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [challengeId]);

  async function withdraw() {
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

  if (loading) return <div className="text-sm text-gray-600">Checking your submission…</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;

  if (!mine) {
    return (
      <div className="rounded-xl border p-4">
        <h2 className="font-medium mb-2">Submit your entry</h2>
        <SubmissionForm challengeId={challengeId} onSubmitted={refresh} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <h2 className="font-medium">Your submission</h2>
      <div className="text-sm text-gray-700">
        <div>Platform: <span className="font-medium">{mine.platform}</span></div>
        {mine.linkUrl ? (
          <div>
            Link:{' '}
            <a className="text-blue-600 underline" href={mine.linkUrl} target="_blank" rel="noreferrer">
              {mine.linkUrl}
            </a>
          </div>
        ) : null}
        <div>Status: <span className="font-medium">{mine.status}</span></div>
        <div>Submitted at: {mine.createdAt.slice(0, 19).replace('T', ' ')}</div>
        <div>Order: #{mine.submissionOrder}</div>
      </div>

      <button
        onClick={withdraw}
        disabled={withdrawing}
        className="text-sm rounded px-3 py-1.5 border text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {withdrawing ? 'Withdrawing…' : 'Withdraw submission'}
      </button>
    </div>
  );
}
