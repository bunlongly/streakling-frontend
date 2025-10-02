export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL as string;

export type ApiSuccess<T> = { status: 'success'; message: string; data: T };
export type ApiFail = { status: 'fail' | 'error'; message: string; errors?: unknown };

export async function backendLogin(
  token: string,
  sensitive?: { phone?: string | null; religion?: string | null; country?: string | null }
): Promise<ApiSuccess<{ userId: string }>> {
  const res = await fetch(`${BACKEND_URL}/api/session/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, sensitive })
  });
  if (!res.ok) throw new Error(`Backend login failed: ${res.status}`);
  return res.json();
}

export async function backendLogout(): Promise<void> {
  await fetch(`${BACKEND_URL}/api/session/logout`, {
    method: 'POST',
    credentials: 'include'
  });
}
