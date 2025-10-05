'use client';

import { useState } from 'react';
import { api, type SignUploadInput } from '@/lib/api';

type Props = {
  label?: string;
  category: 'portfolio' | 'digitalcard' | 'profile';
  onUploadedKeys: (keys: string[]) => void;
  accept?: string;
  maxFiles?: number;
};

export default function MultiImageUploader({
  label = 'Upload images',
  category,
  onUploadedKeys,
  accept = 'image/*',
  maxFiles = 12
}: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setBusy(true);
    setMsg(null);
    try {
      const outKeys: string[] = [];

      for (const file of files.slice(0, maxFiles)) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const payload: SignUploadInput = {
          category,
          purpose: 'media', // ✅ allowed by your backend
          ext,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size
        };
        const signed = await api.uploads.sign(payload);
        const { uploadUrl, key } = signed.data;

        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': payload.contentType },
          body: file
        });
        if (!putRes.ok) {
          throw new Error(
            `Upload failed: ${putRes.status} ${putRes.statusText}`
          );
        }

        outKeys.push(key);
      }

      onUploadedKeys(outKeys);
      setMsg(`Uploaded ${outKeys.length} file(s).`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className='rounded border p-3'>
      <label className='block text-sm font-medium'>{label}</label>
      <input
        type='file'
        accept={accept}
        multiple
        disabled={busy}
        onChange={handleChange}
        className='mt-2 block'
      />
      {msg && <p className='mt-2 text-xs text-neutral-600'>{msg}</p>}
    </div>
  );
}
