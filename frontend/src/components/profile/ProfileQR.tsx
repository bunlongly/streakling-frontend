// src/components/profile/ProfileQR.tsx
'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type Props = {
  url: string;
  label?: string;
  size?: number; // px, default 512
};

export default function ProfileQR({
  url,
  label = 'Profile',
  size = 512
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const png = await QRCode.toDataURL(url, {
          width: size,
          margin: 1,
          errorCorrectionLevel: 'M'
        });
        if (alive) setDataUrl(png);
      } catch {
        setDataUrl(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [url, size]);

  if (!dataUrl) {
    return (
      <div className='rounded-xl border p-4 text-sm text-gray-600'>
        Generating QR…
      </div>
    );
  }

  const fileName =
    (label || 'profile').toLowerCase().replace(/\s+/g, '-') + '-qr.png';

  return (
    <div className='rounded-xl border p-4 space-y-3 max-w-xs'>
      <img
        src={dataUrl}
        alt={`${label} QR code`}
        className='w-full h-auto rounded-lg border'
      />
      <a
        href={dataUrl}
        download={fileName}
        className='px-3 py-1.5 rounded-lg border text-sm'
      >
        Download PNG
      </a>
      <p className='text-xs text-gray-500 break-all'>{url}</p>
    </div>
  );
}
