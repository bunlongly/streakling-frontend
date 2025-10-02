'use client';
import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-dvh bg-brand-mix grid place-items-center p-6">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
