'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';

export default function useBackendSessionSync() {
  const { isSignedIn, getToken } = useAuth();
  const [synced, setSynced] = useState(false);
  const once = useRef(false);

  useEffect(() => {
    if (!isSignedIn || once.current) return;

    (async () => {
      const token = await getToken();
      if (!token) return; // not signed in yet
      await api.session.login(token); // backend sets httpOnly cookie
      once.current = true;
      setSynced(true);
    })().catch(err => {
      console.error('session sync failed', err);
      setSynced(false);
    });
  }, [isSignedIn, getToken]);

  return synced;
}
