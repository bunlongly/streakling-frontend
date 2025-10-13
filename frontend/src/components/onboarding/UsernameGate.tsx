// src/components/onboarding/UsernameGate.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api } from '@/lib/api';

const ONBOARDING_PATH = '/username'; // ✅ correct for app/(onboarding)/username/page.tsx

export default function UsernameGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync();
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    if (!isLoaded || !synced || !isSignedIn) return;
    if (pathname?.startsWith(ONBOARDING_PATH)) return;

    (async () => {
      try {
        const res = await api.profile.get({
          headers: { 'cache-control': 'no-cache' }
        });
        const username = res.data?.username?.trim();
        if (!username) {
          once.current = true;
          const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
          router.replace(`${ONBOARDING_PATH}${next}`);
        }
      } catch {
        // ignore in dev
      }
    })();
  }, [isLoaded, isSignedIn, synced, pathname, router]);

  return null;
}
