'use client';
import { SignIn } from '@clerk/nextjs';
import TurnstileGate from '@/components/security/TurnstileGate';

export default function Page() {
  return (
    <div className="min-h-dvh bg-brand-mix grid place-items-center p-6">
      <TurnstileGate className="w-full max-w-sm">
        <SignIn routing="path" path="/sign-in" />
      </TurnstileGate>
    </div>
  );
}
