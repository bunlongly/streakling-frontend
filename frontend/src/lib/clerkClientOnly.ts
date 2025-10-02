'use client';
import { useAuth } from '@clerk/nextjs';

export function useClerkToken() {
  const { getToken, isSignedIn } = useAuth();
  return { isSignedIn, getToken };
}
