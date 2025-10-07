// src/components/profile/IndustriesInput.tsx
'use client';

import { useEffect, useState } from 'react';

type Props = {
  value?: string[]; // slugs
  onChange?: (v: string[]) => void;
  label?: string;
  placeholder?: string;
};

function normalizeSlug(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export default function IndustriesInput({
  value = [],
  onChange,
  label = 'Industries',
  placeholder = 'e.g. tech, food-reviewer'
}: Props) {
  const [raw, setRaw] = useState(value.join(', '));

  useEffect(() => {
    setRaw(value.join(', '));
  }, [value]);

  function commit(v: string) {
    const items = v.split(',').map(normalizeSlug).filter(Boolean);
    onChange?.(Array.from(new Set(items)));
  }

  return (
    <div className='space-y-2'>
      <label className='block text-sm font-medium'>{label}</label>
      <input
        type='text'
        value={raw}
        onChange={e => {
          const v = e.currentTarget.value;
          setRaw(v);
          commit(v); // commit on each keystroke so Save works immediately
        }}
        placeholder={placeholder}
        className='w-full rounded-xl border px-3 py-2 text-sm'
      />
      <p className='text-xs text-gray-500'>
        Separate with commas. We’ll normalize to slugs.
      </p>
    </div>
  );
}
