'use client';
import { SignUp } from '@clerk/nextjs';
import TurnstileGate from '@/components/security/TurnstileGate';

export default function Page() {
  return (
    <div className="min-h-dvh bg-brand-mix grid place-items-center p-6">
      <TurnstileGate className="w-full max-w-sm">
        <SignUp routing="path" path="/sign-up" />
      </TurnstileGate>
    </div>
  );
}
