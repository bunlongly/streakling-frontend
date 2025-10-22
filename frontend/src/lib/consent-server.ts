// src/lib/consent-server.ts
// This file is SERVER-ONLY.
import 'server-only';
import { cookies } from 'next/headers';
import { CONSENT_COOKIE, defaultConsent, type Consent } from './consent-common';

export async function readServerConsent(): Promise<Consent> {
  try {
    const store = await cookies(); // ✅ Next 15: await cookies()
    const raw = store.get(CONSENT_COOKIE)?.value;
    if (!raw) return defaultConsent;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    return { ...defaultConsent, ...parsed, necessary: true as const };
  } catch {
    return defaultConsent;
  }
}
