// src/lib/consent-common.ts
export const CONSENT_COOKIE = 'consent.v1';

export type Consent = {
  // keep literal so type-safety ensures it's always true
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  functionality: boolean;
};

export const defaultConsent: Consent = {
  necessary: true,
  analytics: false,
  marketing: false,
  functionality: true,
};
