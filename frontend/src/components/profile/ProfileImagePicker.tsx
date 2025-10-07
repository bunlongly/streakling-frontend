// src/components/profile/ProfileImagePicker.tsx
'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';

type Props = {
  label: string;
  purpose: 'avatar' | 'banner';
  value?: string | null; // current key
  onChangeAction?: (key: string | null) => void; // renamed for Next rule
  previewUrl?: string | null; // built URL from key
};

// safe error → message
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'Upload failed';
}

export default function ProfileImagePicker({
  label,
  purpose,
  value,
  onChangeAction,
  previewUrl
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr(null);
    setBusy(true);

    // local object URL for immediate preview
    const tmpUrl = URL.createObjectURL(file);
    setLocalPreview(tmpUrl);

    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const sign = await api.uploads.sign({
        category: 'profile',
        purpose,
        ext,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size
      });

      const { uploadUrl, key } = sign.data;

      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });
      if (!put.ok) {
        throw new Error(`Upload failed: ${put.status} ${put.statusText}`);
      }

      onChangeAction?.(key);
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const shownPreview = localPreview ?? previewUrl ?? null;

  return (
    <div className='space-y-2'>
      <label className='block text-sm font-medium'>{label}</label>
      <div className='flex items-center gap-3'>
        <input
          ref={fileRef}
          type='file'
          accept='image/*'
          disabled={busy}
          onChange={handleFile}
          className='block w-full text-sm'
        />
        {value ? (
          <button
            type='button'
            onClick={() => {
              setLocalPreview(null);
              onChangeAction?.(null);
            }}
            className='px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm'
          >
            Remove
          </button>
        ) : null}
      </div>

      {shownPreview ? (
        <Image
          src={shownPreview}
          alt={label}
          width={192}
          height={192}
          className='h-24 w-auto rounded-xl object-cover border'
        />
      ) : null}

      {err ? <p className='text-sm text-red-600'>{err}</p> : null}
    </div>
  );
}
