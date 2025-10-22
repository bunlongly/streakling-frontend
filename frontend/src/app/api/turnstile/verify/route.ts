// src/app/api/turnstile/verify/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { ok: false, error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    const ip =
      (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      undefined;

    const body = new URLSearchParams();
    body.append('secret', secret);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);

    const r = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        cache: 'no-store'
      }
    );

    const data: { success: boolean; ['error-codes']?: string[] } =
      await r.json();
    if (!data.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Verification failed',
          ...(process.env.NODE_ENV !== 'production' && { details: data })
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
