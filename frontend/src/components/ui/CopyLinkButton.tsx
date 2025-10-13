// src/components/ui/CopyLinkButton.tsx
'use client';

import { useState } from 'react';

export default function CopyLinkButton({
  url,
  className = ''
}: {
  url: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // hide the chip after a moment
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // silent fail; you could optionally show a small error chip here
    }
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type='button'
        onClick={copy}
        className='px-3 py-1.5 text-sm rounded-xl border bg-white hover:bg-gray-50'
        data-stopflip='true'
      >
        Copy link
      </button>
      {copied ? (
        <span className='absolute -top-6 left-1/2 -translate-x-1/2 text-xs rounded-full bg-black text-white px-2 py-0.5'>
          Copied
        </span>
      ) : null}
    </div>
  );
}
