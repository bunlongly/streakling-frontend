// src/lib/api.ts
// Reusable HTTP client + feature APIs + type re-exports

import type {
  DigitalCard,
  UpsertCardInput,
  PublishStatus,
  CardStatus
} from '@/types/digitalCard';
import type {
  Portfolio,
  CreatePortfolioInput,
  UpdatePortfolioInput,
  PortfolioPublicList
} from '@/types/portfolio';
import type { PublicProfile, UpdateMyProfileInput } from '@/types/profile';

export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!API_BASE) throw new Error('NEXT_PUBLIC_BACKEND_URL is not set');

export type ApiSuccess<T> = { status: 'success'; message: string; data: T };
export type ApiFail = {
  status: 'fail' | 'error';
  message: string;
  errors?: unknown;
};

export class HttpError<T = unknown> extends Error {
  status: number;
  data?: T;
  constructor(status: number, message: string, data?: T) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;
type RequestInitExtra = Omit<RequestInit, 'body' | 'method' | 'headers'> & {
  headers?: Record<string, string>;
  query?: Query;
  rawBody?: BodyInit; // for FormData/Blob
};

/** Query helper */
function withQuery(url: string, query?: Query) {
  if (!query) return url;
  const u = new URL(url);
  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

/** Runtime type guard for error payloads */
function hasMessage(x: unknown): x is { message: unknown } {
  return typeof x === 'object' && x !== null && 'message' in x;
}

/** Parse JSON or text without `any` */
async function parseResponse(res: Response): Promise<unknown> {
  const ctype = res.headers.get('content-type') || '';
  if (ctype.includes('application/json')) {
    return res.json() as Promise<unknown>;
  }
  return res.text(); // string
}

class HttpClient {
  constructor(private base: string) {}

  private async request<T>(
    path: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    init?: RequestInitExtra,
    body?: unknown
  ): Promise<T> {
    const url = withQuery(`${this.base}${path}`, init?.query);
    const isJsonBody = body !== undefined && init?.rawBody === undefined;

    const res = await fetch(url, {
      method,
      credentials: 'include', // CRITICAL: include cookies for session
      ...init,
      headers: {
        ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers || {})
      },
      body: isJsonBody ? JSON.stringify(body) : init?.rawBody ?? undefined
    });

    const parsed = await parseResponse(res);

    if (!res.ok) {
      const message =
        hasMessage(parsed) && typeof parsed.message === 'string'
          ? parsed.message
          : `${res.status} ${res.statusText}`;
      throw new HttpError(res.status, message, parsed);
    }

    return parsed as T;
  }

  get<T>(path: string, init?: RequestInitExtra) {
    return this.request<T>(path, 'GET', init);
  }
  post<T>(path: string, body?: unknown, init?: RequestInitExtra) {
    return this.request<T>(path, 'POST', init, body);
  }
  patch<T>(path: string, body?: unknown, init?: RequestInitExtra) {
    return this.request<T>(path, 'PATCH', init, body);
  }
  delete<T>(path: string, init?: RequestInitExtra) {
    return this.request<T>(path, 'DELETE', init);
  }
}

export const http = new HttpClient(API_BASE);

/* ================== Feature APIs ================== */

// ---- Profile ----
export const apiProfile = {
  get: (init?: RequestInitExtra) =>
    http.get<ApiSuccess<PublicProfile>>('/api/profile', init),

  update: (payload: UpdateMyProfileInput) =>
    http.patch<ApiSuccess<PublicProfile>>('/api/profile', payload),

  publicGetByUsername: (username: string, init?: RequestInitExtra) =>
    http.get<ApiSuccess<PublicProfile>>(
      `/api/u/${encodeURIComponent(username)}`,
      init
    ),


  listPublic: (params?: { q?: string; limit?: number; cursor?: string }) =>
    http.get<ApiSuccess<{ items: PublicProfile[]; nextCursor: string | null }>>(
      '/api/profiles/public',
      { query: params }
    ),


  publicGetById: (id: string, init?: RequestInitExtra) =>
    http.get<ApiSuccess<PublicProfile>>(
      `/api/u/id/${encodeURIComponent(id)}`,
      init
    )
};

// ---- Session (Clerk token -> backend cookie) ----
export const apiSession = {
  login: (
    token: string,
    sensitive?: {
      phone?: string | null;
      religion?: string | null;
      country?: string | null;
    }
  ) =>
    http.post<ApiSuccess<{ userId: string }>>('/api/session/login', {
      token,
      sensitive
    }),
  logout: () => http.post<void>('/api/session/logout')
};

// ---- Digital Name Cards (multi-card, slugged, publishable) ----
export const apiCard = {
  publicGetBySlug: (slug: string) =>
    http.get<ApiSuccess<DigitalCard>>(
      `/api/digital-name-card/slug/${encodeURIComponent(slug)}`
    ),

  listPublished: (params?: { q?: string; take?: number; cursor?: string }) =>
    http.get<
      ApiSuccess<{
        items: (DigitalCard & { canEdit?: boolean })[];
        nextCursor: string | null;
      }>
    >('/api/digital-name-cards', { query: params }),

  listMine: () =>
    http.get<ApiSuccess<DigitalCard[]>>('/api/me/digital-name-cards'),

  create: (payload: UpsertCardInput) =>
    http.post<ApiSuccess<DigitalCard>>('/api/digital-name-cards', payload),

  getById: (id: string, init?: RequestInitExtra) =>
    http.get<ApiSuccess<DigitalCard>>(`/api/digital-name-cards/${id}`, init),

  updateById: (id: string, payload: Partial<UpsertCardInput>) =>
    http.patch<ApiSuccess<DigitalCard>>(
      `/api/digital-name-cards/${id}`,
      payload
    ),

  deleteById: (id: string) =>
    http.delete<ApiSuccess<{ id: string }>>(`/api/digital-name-cards/${id}`)
};

// ---- Portfolios ----
export const apiPortfolio = {
  listPublic: (params?: { limit?: number; cursor?: string }) =>
    http.get<ApiSuccess<PortfolioPublicList>>('/api/portfolios/public', {
      query: params
    }),

  listMine: (init?: RequestInitExtra) =>
    http.get<ApiSuccess<Portfolio[]>>('/api/portfolios', init),

  getById: (id: string, init?: RequestInitExtra) =>
    http.get<ApiSuccess<Portfolio>>(`/api/portfolios/${id}`, init),

  create: (payload: CreatePortfolioInput) =>
    http.post<ApiSuccess<Portfolio>>('/api/portfolios', payload),

  updateById: (id: string, payload: UpdatePortfolioInput) =>
    http.patch<ApiSuccess<Portfolio>>(`/api/portfolios/${id}`, payload),

  deleteById: (id: string) =>
    http.delete<ApiSuccess<{ deleted: boolean }>>(`/api/portfolios/${id}`),

  publicGetBySlug: (slug: string) =>
    http.get<ApiSuccess<Portfolio>>(
      `/api/portfolios/slug/${encodeURIComponent(slug)}`
    ),

  /** Copy some defaults from a card the user owns */
  prefillFromCard: (cardId: string) =>
    http.get<
      ApiSuccess<{
        title?: string;
        description?: string;
        about?: {
          firstName?: string;
          lastName?: string;
          role?: string;
          shortBio?: string;
          company?: string;
          university?: string;
          country?: string;
          avatarKey?: string;
          bannerKey?: string;
        };
      }>
    >(`/api/portfolios/prefill-from-card/${encodeURIComponent(cardId)}`)
};

// ---- Upload signing ----
// Match your backend sign response: { key, uploadUrl, url }
export type SignUploadInput = {
  category: 'digitalcard' | 'portfolio' | 'profile';
  purpose?: string; // 'avatar' | 'banner' | 'cover' | 'media'
  ext: string; // 'png' | 'jpg' | 'webp' | ...
  contentType: string; // 'image/png', ...
  sizeBytes: number;
};
export type SignUploadResponse = {
  key: string;
  uploadUrl: string;
  url: string; // final public URL (if bucket is public)
  // expiresInSec?: number; // optional if you add it later
};

export const apiUploads = {
  sign: (payload: SignUploadInput) =>
    http.post<ApiSuccess<SignUploadResponse>>('/api/uploads/sign', payload)
};

// ---- Grouped export ----
export const api = {
  session: apiSession,
  card: apiCard,
  portfolio: apiPortfolio,
  uploads: apiUploads,
  profile: apiProfile
};

// Re-export types for convenience
export type {
  DigitalCard,
  UpsertCardInput,
  PublishStatus,
  CardStatus,
  Portfolio,
  CreatePortfolioInput,
  UpdatePortfolioInput,
  PublicProfile,
  UpdateMyProfileInput
};
