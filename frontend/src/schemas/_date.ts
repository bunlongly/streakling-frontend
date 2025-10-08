// src/schemas/_date.ts
import { z } from 'zod';

function parseMaybeDate(v: unknown): Date | null | undefined {
  if (v == null) return undefined;
  if (v === '') return null;
  if (v instanceof Date) return isNaN(+v) ? undefined : v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    const iso = /T\d{2}:\d{2}/.test(s) ? s : `${s}T00:00:00.000Z`;
    const d = new Date(iso);
    return isNaN(+d) ? undefined : d;
  }
  return undefined;
}

export const zOptionalDate = z.preprocess(
  v => parseMaybeDate(v),
  z.date().nullable().optional()
);

export const zNullableDate = z.preprocess(
  v => (v === undefined ? null : parseMaybeDate(v) ?? null),
  z.date().nullable()
);
