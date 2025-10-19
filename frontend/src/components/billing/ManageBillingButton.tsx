'use client';

export default function ManageBillingButton({
  className = '',
  children = 'Manage billing'
}: { className?: string; children?: React.ReactNode }) {
  const onClick = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/billing/portal`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch {
      // no-op; you can toast here
    }
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-black text-white hover:opacity-90 ${className}`}
    >
      {children}
    </button>
  );
}
