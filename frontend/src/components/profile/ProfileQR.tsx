// src/components/profile/ProfileQR.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type Props = {
  url: string;
  label?: string;
  size?: number; // rendered px size (default 256)
  showActions?: boolean; // show download / copy buttons
  showLabel?: boolean; // show small title above QR
  className?: string;
};

export default function ProfileQR({
  url,
  label = 'Profile',
  size = 256,
  showActions = true,
  showLabel = true,
  className = ''
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileName = useMemo(
    () =>
      ((label || 'profile').toLowerCase().replace(/\s+/g, '-') || 'profile') +
      '-qr.png',
    [label]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // ✅ dynamic import; don't reference a "QRCode" symbol
        const { toDataURL } = await import('qrcode');
        const png = await toDataURL(url, {
          width: size,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#ffffff' }
        });
        if (alive) setDataUrl(png);
      } catch (err) {
        console.error('QR generation failed:', err);
        if (alive) setDataUrl(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [url, size]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  if (!dataUrl) {
    return (
      <div
        className='rounded-2xl bg-white/80 p-4 shadow-sm text-sm text-gray-500'
        aria-live='polite'
      >
        Generating QR…
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-white/90 p-4 shadow-lg ${className}`}>
      {showLabel && (
        <div className='mb-2 text-xs font-medium text-gray-600'>{label}</div>
      )}

      <div className='relative rounded-xl overflow-hidden'>
        <Image
          src={dataUrl}
          alt={`${label} QR code`}
          width={size}
          height={size}
          unoptimized
          priority
          className='h-auto w-full'
        />
      </div>

      {showActions && (
        <>
          <div className='mt-3 flex flex-wrap items-center justify-center gap-2'>
            <a
              href={dataUrl}
              download={fileName}
              className='px-3 py-1.5 rounded-full border text-xs bg-white hover:bg-gray-50'
            >
              Download PNG
            </a>
            <button
              type='button'
              onClick={copy}
              className='relative px-3 py-1.5 rounded-full border text-xs bg-white hover:bg-gray-50'
            >
              Copy link
              {copied && (
                <span className='absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-black text-white px-2 py-0.5 text-[10px]'>
                  Copied
                </span>
              )}
            </button>
          </div>

          <p className='mt-2 text-[11px] text-gray-500 break-all text-center'>
            {url}
          </p>
        </>
      )}
    </div>
  );
}
