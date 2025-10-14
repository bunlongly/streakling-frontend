// src/app/admin/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api } from '@/lib/api';

// 📊 Recharts (client-only)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

/* ========= tiny inline hook: fetches me (including role) ========= */
type Me = { id: string; displayName: string; role?: 'ADMIN' | 'USER' };
function useMe(enabled: boolean) {
  const [data, setData] = React.useState<Me | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;
    let stop = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.profile.get();
        const d = (res as any).data || (res as any); // api wrapper returns {status,data}
        if (!stop)
          setData({ id: d.id, displayName: d.displayName, role: d.role });
      } catch (e: any) {
        if (!stop) setError(e?.message || 'Failed to load me');
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [enabled]);

  return { data, error, loading };
}

/* ========= date utils to build charts ========= */
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function formatMD(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}
function daysRange(n: number) {
  const out: Date[] = [];
  const today = startOfDay(new Date());
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
}
function countByDay(rows: Array<{ createdAt: string | Date }>, days = 14) {
  const bucket = new Map<string, number>();
  const keys = daysRange(days).map(d => startOfDay(d).toISOString());
  keys.forEach(k => bucket.set(k, 0));

  for (const r of rows) {
    const raw = new Date(r.createdAt);
    if (Number.isNaN(raw.getTime())) continue;
    const k = startOfDay(raw).toISOString();
    if (bucket.has(k)) bucket.set(k, (bucket.get(k) || 0) + 1);
  }
  return keys.map(k => {
    const d = new Date(k);
    return { day: formatMD(d), count: bucket.get(k) || 0 };
  });
}
function countByPublishStatus<T extends { publishStatus?: string }>(rows: T[]) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const key = (r.publishStatus || 'UNKNOWN').toUpperCase();
    m.set(key, (m.get(key) || 0) + 1);
  }
  return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
}

/* ========= friendly loader ========= */
function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white/70 ring-1 ring-black/5 p-4 animate-pulse ${className}`}
    >
      <div className='h-4 w-24 bg-black/10 rounded mb-3' />
      <div className='h-6 w-16 bg-black/10 rounded' />
    </div>
  );
}

/* ========= tiny modal primitives (no external deps) ========= */
type ModalKind = null | 'users' | 'challenges' | 'cards' | 'portfolios';

function ModalShell({
  title,
  open,
  onClose,
  children
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div
        className='fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-label={title}
        className='fixed inset-0 z-[91] flex items-center justify-center p-4'
      >
        <div className='w-full max-w-5xl rounded-2xl bg-white/95 ring-1 ring-black/10 shadow-2xl'>
          <div className='flex items-center justify-between px-5 py-4 border-b border-black/10'>
            <h3 className='text-base font-semibold'>{title}</h3>
            <button
              onClick={onClose}
              className='rounded-lg px-3 py-1.5 text-sm ring-1 ring-black/10 hover:bg-black/5'
              aria-label='Close'
            >
              Close
            </button>
          </div>
          <div className='p-4'>{children}</div>
        </div>
      </div>
    </>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className='relative'>
      <input
        className='w-full rounded-xl border border-black/10 bg-white px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/30'
        placeholder={placeholder ?? 'Search…'}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <svg
        className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400'
        viewBox='0 0 20 20'
        fill='currentColor'
        aria-hidden
      >
        <path
          fillRule='evenodd'
          d='M12.9 14.32a7 7 0 111.414-1.414l3.387 3.386a1 1 0 01-1.414 1.415l-3.387-3.387zM14 9a5 5 0 11-10 0 5 5 0 0110 0z'
          clipRule='evenodd'
        />
      </svg>
    </div>
  );
}

function Table({
  headers,
  rows
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className='overflow-auto'>
      <table className='min-w-full text-sm'>
        <thead className='text-left'>
          <tr>
            {headers.map(h => (
              <th
                key={h}
                className='px-3 py-2 font-semibold text-gray-600 sticky top-0 bg-white'
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='divide-y divide-black/5'>
          {rows.length === 0 ? (
            <tr>
              <td className='px-3 py-6 text-gray-500' colSpan={headers.length}>
                No results.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className='hover:bg-black/2'>
                {r.map((cell, j) => (
                  <td key={j} className='px-3 py-2'>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ======================= Admin Dashboard ======================= */
export default function AdminDashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync();
  const { data: me } = useMe(isLoaded && isSignedIn && synced);
  const router = useRouter();

  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [stats, setStats] = React.useState<{
    users: number;
    challenges: number;
    digitalCards: number;
    portfolios: number;
  } | null>(null);

  const [users, setUsers] = React.useState<{
    items: any[];
    nextCursor: string | null;
  } | null>(null);
  const [challenges, setChallenges] = React.useState<{
    items: any[];
    nextCursor: string | null;
  } | null>(null);
  const [cards, setCards] = React.useState<{
    items: any[];
    nextCursor: string | null;
  } | null>(null);
  const [portfolios, setPortfolios] = React.useState<{
    items: any[];
    nextCursor: string | null;
  } | null>(null);

  // NEW: modal state
  const [modal, setModal] = React.useState<ModalKind>(null);
  const [modalQuery, setModalQuery] = React.useState('');

  // Redirect non-admins (UX only; server still protects /api/admin/*)
  React.useEffect(() => {
    if (!isLoaded || !synced) return;
    if (isLoaded && isSignedIn && me && me.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, synced, me, router]);

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn || !synced || me?.role !== 'ADMIN') return;
    (async () => {
      try {
        setLoading(true);
        // Grab enough rows to make charts & modals meaningful
        const [s, u, c, d, p] = await Promise.all([
          api.admin.getStats(),
          api.admin.listUsers({ limit: 500 }),
          api.admin.listChallenges({ limit: 500 }),
          api.admin.listCards({ limit: 500 }),
          api.admin.listPortfolios({ limit: 500 })
        ]);
        setStats((s as any).data || (s as any));
        setUsers((u as any).data || (u as any));
        setChallenges((c as any).data || (c as any));
        setCards((d as any).data || (d as any));
        setPortfolios((p as any).data || (p as any));
      } catch (e: any) {
        setErr(e?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, synced, me?.role]);

  if (!isLoaded || !synced)
    return <div className='p-6'>Preparing your session…</div>;
  if (!isSignedIn) return <div className='p-6'>Please sign in.</div>;
  if (me && me.role !== 'ADMIN') {
    return (
      <main className='min-h-dvh bg-brand-mix'>
        <div className='max-w-3xl mx-auto p-6'>
          <div className='rounded-2xl p-4 bg-white/80 ring-1 ring-black/5'>
            You don’t have access to the admin dashboard.
          </div>
        </div>
      </main>
    );
  }

  // ==== chart data prep (safe if lists are still null) ====
  const usersDaily = countByDay(
    (users?.items ?? []).map((u: any) => ({ createdAt: u.createdAt })),
    14
  );
  const challengesDaily = countByDay(
    (challenges?.items ?? []).map((u: any) => ({ createdAt: u.createdAt })),
    14
  );
  const cardsByStatus = countByPublishStatus(cards?.items ?? []);
  const portfoliosByStatus = countByPublishStatus(portfolios?.items ?? []);

  const COLORS = [
    '#0ea5e9',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#a855f7',
    '#64748b'
  ];

  // ===== modal content builders =====
  const filter = (text: string) =>
    text.toLowerCase().includes(modalQuery.trim().toLowerCase());

  const modalTitle =
    modal === 'users'
      ? 'All Users'
      : modal === 'challenges'
      ? 'All Challenges'
      : modal === 'cards'
      ? 'All Digital Cards'
      : modal === 'portfolios'
      ? 'All Portfolios'
      : '';

  const modalRows: React.ReactNode[][] =
    modal === 'users'
      ? (users?.items ?? [])
          .filter(
            (u: any) =>
              !modalQuery ||
              filter(u.displayName || '') ||
              filter(u.name || '') ||
              filter(u.email || '') ||
              filter(u.id || '')
          )
          .map((u: any) => [
            <span key='n' className='font-medium'>
              {u.displayName || u.name || u.email || u.id}
            </span>,
            <span key='r' className='text-xs px-2 py-0.5 rounded bg-gray-100'>
              {(u.role || 'USER').toUpperCase()}
            </span>,
            <span key='t' className='text-xs text-gray-500'>
              {new Date(u.createdAt).toLocaleString()}
            </span>
          ])
      : modal === 'challenges'
      ? (challenges?.items ?? [])
          .filter(
            (c: any) =>
              !modalQuery ||
              filter(c.title || '') ||
              filter(c.status || '') ||
              filter(c.id || '')
          )
          .map((c: any) => [
            <span key='t' className='font-medium'>
              {c.title}
            </span>,
            <span key='s' className='text-xs px-2 py-0.5 rounded bg-gray-100'>
              {c.status}
            </span>,
            <span key='c' className='text-xs text-gray-500'>
              {new Date(c.createdAt).toLocaleString()}
            </span>,
            <span key='_c' className='text-xs text-gray-500'>
              submissions: {c._count?.submissions ?? 0}
            </span>
          ])
      : modal === 'cards'
      ? (cards?.items ?? [])
          .filter(
            (d: any) =>
              !modalQuery ||
              filter(d.firstName || '') ||
              filter(d.lastName || '') ||
              filter(d.slug || '') ||
              filter(d.publishStatus || '')
          )
          .map((d: any) => [
            <span key='n' className='font-medium'>
              {`${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || d.slug}
            </span>,
            <span key='ps' className='text-xs px-2 py-0.5 rounded bg-gray-100'>
              {d.publishStatus}
            </span>,
            <span key='t' className='text-xs text-gray-500'>
              {new Date(d.createdAt).toLocaleString()}
            </span>
          ])
      : modal === 'portfolios'
      ? (portfolios?.items ?? [])
          .filter(
            (p: any) =>
              !modalQuery ||
              filter(p.title || '') ||
              filter(p.slug || '') ||
              filter(p.publishStatus || '')
          )
          .map((p: any) => [
            <span key='n' className='font-medium'>
              {p.title || p.slug}
            </span>,
            <span key='ps' className='text-xs px-2 py-0.5 rounded bg-gray-100'>
              {p.publishStatus}
            </span>,
            <span key='t' className='text-xs text-gray-500'>
              {new Date(p.createdAt).toLocaleString()}
            </span>
          ])
      : [];

  const modalHeaders =
    modal === 'users'
      ? ['User', 'Role', 'Joined']
      : modal === 'challenges'
      ? ['Title', 'Status', 'Created', 'Submissions']
      : modal === 'cards'
      ? ['Name / Slug', 'Status', 'Created']
      : modal === 'portfolios'
      ? ['Title / Slug', 'Status', 'Created']
      : [];

  return (
    <main className='min-h-dvh bg-brand-mix'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* header */}
        <div className='sticky top-0 z-10 -mx-4 px-4 pt-4 backdrop-blur-md'>
          <div className='card-surface rounded-2xl ring-1 ring-white/40 px-4 py-4 flex items-center justify-between'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Admin Dashboard
            </h1>
            <Link
              href='/'
              className='rounded-xl px-3 py-2 text-sm ring-1 ring-white/50 hover:bg-white/60'
            >
              ← Back home
            </Link>
          </div>
        </div>

        {err ? (
          <div className='mt-4 rounded-xl bg-rose-50/90 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200/80'>
            {err}
          </div>
        ) : null}

        {/* tiles */}
        <section className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4'>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : [
                { label: 'Users', value: stats?.users ?? 0 },
                { label: 'Challenges', value: stats?.challenges ?? 0 },
                { label: 'Digital Cards', value: stats?.digitalCards ?? 0 },
                { label: 'Portfolios', value: stats?.portfolios ?? 0 }
              ].map(t => (
                <div
                  key={t.label}
                  className='rounded-2xl bg-white/75 ring-1 ring-black/5 p-4 shadow-sm'
                >
                  <div className='text-xs text-gray-500'>{t.label}</div>
                  <div className='text-2xl font-semibold'>{t.value}</div>
                </div>
              ))}
        </section>

        {/* charts row */}
        <section className='grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6'>
          {/* Users vs Challenges over last 14 days */}
          <div className='rounded-2xl bg-white/80 ring-1 ring-black/5 p-4 shadow-sm lg:col-span-2'>
            <div className='flex items-center justify-between mb-2'>
              <h2 className='text-sm font-semibold'>
                Signups & New Challenges (14 days)
              </h2>
              <span className='text-xs text-gray-500'>Daily totals</span>
            </div>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart
                  data={usersDaily.map((u, i) => ({
                    day: u.day,
                    users: u.count,
                    challenges: challengesDaily[i]?.count ?? 0
                  }))}
                  margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='day' tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='users'
                    stroke='#0ea5e9'
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type='monotone'
                    dataKey='challenges'
                    stroke='#22c55e'
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cards status distribution */}
          <div className='rounded-2xl bg-white/80 ring-1 ring-black/5 p-4 shadow-sm'>
            <h2 className='text-sm font-semibold mb-2'>
              Digital Cards by Status
            </h2>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={cardsByStatus}
                    dataKey='value'
                    nameKey='name'
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {cardsByStatus.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* second charts row */}
        <section className='grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4'>
          {/* Portfolios status distribution */}
          <div className='rounded-2xl bg-white/80 ring-1 ring-black/5 p-4 shadow-sm'>
            <h2 className='text-sm font-semibold mb-2'>Portfolios by Status</h2>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={portfoliosByStatus}
                    dataKey='value'
                    nameKey='name'
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {portfoliosByStatus.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Challenges by day (bar) */}
          <div className='rounded-2xl bg-white/80 ring-1 ring-black/5 p-4 shadow-sm lg:col-span-2'>
            <div className='flex items-center justify-between mb-2'>
              <h2 className='text-sm font-semibold'>
                New Challenges (14 days)
              </h2>
              <span className='text-xs text-gray-500'>Daily totals</span>
            </div>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={challengesDaily}
                  margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='day' tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey='count' fill='#22c55e' radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* lists */}
        <section className='grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6'>
          <AdminList
            title='Recent Users'
            rows={(users?.items ?? []).map((u: any) => ({
              key: u.id,
              primary: u.displayName || u.name || u.email || u.id,
              secondary: `${(u.role || 'USER').toUpperCase()} • ${new Date(
                u.createdAt
              ).toLocaleString()}`
            }))}
            onViewAll={() => {
              setModalQuery('');
              setModal('users');
            }}
          />
          <AdminList
            title='Recent Challenges'
            rows={(challenges?.items ?? []).map((c: any) => ({
              key: c.id,
              primary: c.title,
              secondary: `${c.status} • submissions: ${
                c._count?.submissions ?? 0
              }`
            }))}
            onViewAll={() => {
              setModalQuery('');
              setModal('challenges');
            }}
          />
          <AdminList
            title='Recent Digital Cards'
            rows={(cards?.items ?? []).map((d: any) => ({
              key: d.id,
              primary:
                `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || d.slug,
              secondary: `${d.publishStatus} • ${new Date(
                d.createdAt
              ).toLocaleDateString()}`
            }))}
            onViewAll={() => {
              setModalQuery('');
              setModal('cards');
            }}
          />
          <AdminList
            title='Recent Portfolios'
            rows={(portfolios?.items ?? []).map((p: any) => ({
              key: p.id,
              primary: p.title || p.slug,
              secondary: `${p.publishStatus} • ${new Date(
                p.createdAt
              ).toLocaleDateString()}`
            }))}
            onViewAll={() => {
              setModalQuery('');
              setModal('portfolios');
            }}
          />
        </section>
      </div>

      {/* ======= MODAL ======= */}
      <ModalShell
        title={modalTitle}
        open={modal !== null}
        onClose={() => setModal(null)}
      >
        <div className='space-y-3'>
          <SearchBox
            value={modalQuery}
            onChange={setModalQuery}
            placeholder='Search…'
          />
          <div className='rounded-xl ring-1 ring-black/10 overflow-hidden'>
            <Table headers={modalHeaders} rows={modalRows} />
          </div>
        </div>
      </ModalShell>
    </main>
  );
}

/* ========= shared list card ========= */
function AdminList({
  title,
  rows,
  onViewAll
}: {
  title: string;
  rows: Array<{ key: string; primary: string; secondary?: string }>;
  onViewAll?: () => void;
}) {
  return (
    <div className='rounded-2xl bg-white/80 ring-1 ring-black/5 shadow-sm'>
      <div className='px-4 py-3 border-b border-black/5 flex items-center justify-between'>
        <h2 className='text-sm font-semibold'>{title}</h2>
        {onViewAll ? (
          <button
            onClick={onViewAll}
            className='text-xs underline underline-offset-2 text-[color:var(--color-primary)]'
          >
            View all
          </button>
        ) : null}
      </div>
      <ul className='divide-y divide-black/5'>
        {rows.length === 0 ? (
          <li className='px-4 py-4 text-sm text-gray-500'>No data.</li>
        ) : (
          rows.slice(0, 6).map(r => (
            <li key={r.key} className='px-4 py-3'>
              <div className='text-sm font-medium'>{r.primary}</div>
              {r.secondary ? (
                <div className='text-xs text-gray-500'>{r.secondary}</div>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
