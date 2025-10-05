'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';

type Props = {
  label: string;
  category: 'digitalcard' | 'portfolio' | 'profile';
  purpose?: string;
  accept?: string; // default 'image/*'
  maxBytes?: number; // default 5MB
  previewUrl?: string | null;
  existingKey?: string | null;

  /**
   * NOTE: renamed from `onUploaded` -> `onUploadedAction`
   * to satisfy: “Props must be serializable for components
   * in the 'use client' entry file…”
   */
  onUploadedAction: (key: string) => void;
};

export default function ImageUploader({
  label,
  category,
  purpose,
  accept = 'image/*',
  maxBytes = 5 * 1024 * 1024,
  previewUrl,
  existingKey,
  onUploadedAction
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local blob preview (shows immediately on file select)
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Optional remote preview if you configured public access
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE;
  const remoteFromKey =
    !localPreview && !previewUrl && existingKey && PUBLIC_BASE
      ? `${PUBLIC_BASE}/${existingKey}`
      : null;

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const pickFile = () => inputRef.current?.click();

  const handlePick = async (file: File) => {
    if (!file) return;
    setError(null);

    if (file.size > maxBytes) {
      setError(`File too large. Max ${(maxBytes / 1024 / 1024).toFixed(1)}MB.`);
      return;
    }

    // Always show a local preview (works even if the bucket is private)
    const blob = URL.createObjectURL(file);
    setLocalPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return blob;
    });

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const contentType = file.type || 'application/octet-stream';

    try {
      setUploading(true);

      // 1) Ask backend for presigned PUT
      const { data } = await api.uploads.sign({
        category,
        purpose,
        ext,
        contentType,
        sizeBytes: file.size
      });

      // 2) Upload file directly to S3
      const put = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file
      });
      if (!put.ok) throw new Error(`Upload failed: ${put.status}`);

      // 3) Inform parent with the S3 key
      onUploadedAction(data.key);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const shownSrc = localPreview || previewUrl || remoteFromKey || null;
  const isBlobLike =
    typeof shownSrc === 'string' &&
    (shownSrc.startsWith('blob:') || shownSrc.startsWith('data:'));

  return (
    <div className='grid gap-2'>
      <label className='font-medium'>{label}</label>

      {shownSrc ? (
        isBlobLike ? (
          // For blob/data previews, next/image can’t optimize; use <img> and silence the rule here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownSrc}
            alt='preview'
            width={112}
            height={112}
            className='h-28 w-28 object-cover rounded-lg border border-white/10'
          />
        ) : (
          <Image
            src={shownSrc}
            alt='preview'
            width={112}
            height={112}
            className='h-28 w-28 object-cover rounded-lg border border-white/10'
            priority
          />
        )
      ) : (
        <div className='h-28 w-28 grid place-items-center rounded-lg border border-dashed border-white/15 text-sm opacity-80'>
          No image
        </div>
      )}

      <div className='flex items-center gap-3'>
        <button
          type='button'
          className='btn-outline'
          onClick={pickFile}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Choose image'}
        </button>
        <input
          ref={inputRef}
          type='file'
          accept={accept}
          style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && handlePick(e.target.files[0])}
        />
      </div>

      {error && <p className='text-red-400 text-sm'>{error}</p>}
      <p className='muted text-xs'>PNG/JPG/WebP recommended. Max 5MB.</p>
    </div>
  );
}
