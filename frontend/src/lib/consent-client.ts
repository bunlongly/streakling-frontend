// src/lib/consent-client.ts
// This file is CLIENT-ONLY. No next/headers import.
import { CONSENT_COOKIE, defaultConsent, type Consent } from './consent-common';

export { CONSENT_COOKIE, defaultConsent };
export type { Consent };

export function readClientConsent(): Consent {
  try {
    const raw = document.cookie
      .split('; ')
      .find(s => s.startsWith(CONSENT_COOKIE + '='))
      ?.split('=')[1];
    if (!raw) return defaultConsent;
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<Consent>;
    return { ...defaultConsent, ...parsed, necessary: true as const };
  } catch {
    return defaultConsent;
  }
}

export function writeClientConsent(c: Consent) {
  const sixMonths = 60 * 60 * 24 * 30 * 6;
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
    JSON.stringify(c)
  )}; Max-Age=${sixMonths}; Path=/; SameSite=Lax`;
}
