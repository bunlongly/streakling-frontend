'use client';
import { useEffect, useRef } from 'react';
import { useClerkToken } from './clerkClientOnly';
import { backendLogin } from './backend';

export default function useBackendSessionSync() {
  const { isSignedIn, getToken } = useClerkToken();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || syncedRef.current) return;
    (async () => {
      const token = await getToken(); // Clerk JWT for backend verification
      if (!token) return;
      await backendLogin(token);
      syncedRef.current = true;
    })().catch(console.error);
  }, [isSignedIn, getToken]);
}
