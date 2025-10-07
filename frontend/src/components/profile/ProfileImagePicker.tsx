// src/components/profile/ProfileImagePicker.tsx
'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';

type Props = {
  label: string;
  purpose: 'avatar' | 'banner';
  value?: string | null; // current key
  onChange?: (key: string | null) => void;
  previewUrl?: string | null; // built URL from key
};

export default function ProfileImagePicker({
  label,
  purpose,
  value,
  onChange,
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

      onChange?.(key);
    } catch (e: any) {
      setErr(e?.message ?? 'Upload failed');
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
              onChange?.(null);
            }}
            className='px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm'
          >
            Remove
          </button>
        ) : null}
      </div>

      {shownPreview ? (
        <img
          src={shownPreview}
          alt={label}
          className='h-24 w-auto rounded-xl object-cover border'
        />
      ) : null}

      {err ? <p className='text-sm text-red-600'>{err}</p> : null}
    </div>
  );
}
