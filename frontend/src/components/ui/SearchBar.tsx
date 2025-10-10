'use client';

import * as React from 'react';

export type SearchFilters = {
  role?: string;
  app?: string;
  hasAvatar?: boolean;
};

type SearchBarProps = {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  placeholder?: string;

  // Advanced filters (optional: omit if you don't need them)
  filters?: SearchFilters;
  onFiltersChange?: (f: SearchFilters) => void;

  className?: string;
};

export default function SearchBar({
  value,
  onChange,
  onClear,
  onSubmit,
  isLoading = false,
  placeholder = 'Search name, role, app name…',
  filters,
  onFiltersChange,
  className
}: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false); // advanced panel

  // Keyboard quick focus with "/"
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName ?? '';
      if (e.key === '/' && !/input|textarea|select/i.test(tag)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const setFilter = (
    key: keyof SearchFilters,
    v: string | boolean | undefined
  ) => {
    if (!onFiltersChange) return;
    onFiltersChange({ ...(filters ?? {}), [key]: v });
  };

  return (
    <div className={['relative', className || ''].join(' ')}>
      {/* Outer animated ring (subtle) */}
      <div
        className='
        rounded-full p-[2px]
        bg-[linear-gradient(120deg,rgba(158,85,247,0.8),rgba(68,122,238,0.8),rgba(19,185,163,0.8))]
        bg-[length:300%_300%] animate-[border-pan_14s_ease-in-out_infinite]
      '
      >
        {/* Input surface */}
        <div
          className='
          relative rounded-full bg-white/90 backdrop-blur
          shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)]
        '
        >
          {/* Left icon */}
          <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden='true'
            >
              <path
                d='M21 21l-4.35-4.35m1.02-5.33a6.67 6.67 0 11-13.34 0 6.67 6.67 0 0113.34 0z'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </span>

          {/* Input */}
          <input
            ref={inputRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && onSubmit) onSubmit();
              if (e.key === 'Escape') onClear();
            }}
            placeholder={placeholder}
            className='
              w-full rounded-full border border-transparent
              pl-12 pr-[116px] py-3 text-sm
              focus:outline-none focus:ring-0
              bg-transparent
            '
            aria-label='Search digital cards'
          />

          {/* Right cluster: Advanced | Clear/Spinner | Hint */}
          <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1'>
            {/* Advanced toggle */}
            {onFiltersChange && (
              <button
                type='button'
                onClick={() => setOpen(v => !v)}
                className='rounded-full px-3 py-1.5 text-xs border hover:bg-gray-50'
                aria-expanded={open}
                aria-controls='advanced-panel'
              >
                Advanced
              </button>
            )}

            {/* Clear / Spinner */}
            {isLoading ? (
              <span
                className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent'
                aria-label='Loading'
              />
            ) : value ? (
              <button
                type='button'
                onClick={onClear}
                className='rounded-full px-2 py-1 text-gray-500 hover:bg-gray-100'
                aria-label='Clear search'
                title='Clear'
              >
                ×
              </button>
            ) : null}

            {/* Shortcut hint */}
            <span className='hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-gray-500'>
              /
            </span>
          </div>
        </div>
      </div>

      {/* Advanced panel */}
      {onFiltersChange && (
        <div
          id='advanced-panel'
          className={`
            ${
              open
                ? 'opacity-100 translate-y-1 pointer-events-auto'
                : 'opacity-0 -translate-y-1 pointer-events-none'
            }
            transition-all duration-200
            absolute z-20 mt-2 w-full sm:w-[520px]
          `}
        >
          <div className='rounded-2xl border bg-white/95 backdrop-blur p-4 shadow-lg'>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              {/* Role */}
              <div className='space-y-1'>
                <label className='text-xs font-medium text-gray-700'>
                  Role
                </label>
                <input
                  value={filters?.role ?? ''}
                  onChange={e => setFilter('role', e.target.value)}
                  placeholder='e.g., Designer, Engineer'
                  className='w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>

              {/* App */}
              <div className='space-y-1'>
                <label className='text-xs font-medium text-gray-700'>App</label>
                <input
                  value={filters?.app ?? ''}
                  onChange={e => setFilter('app', e.target.value)}
                  placeholder='e.g., Streakling'
                  className='w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>

              {/* Avatar */}
              <div className='space-y-1'>
                <label className='text-xs font-medium text-gray-700'>
                  Avatar
                </label>
                <div className='flex items-center gap-2 rounded-xl border px-3 py-2'>
                  <input
                    id='hasAvatar'
                    type='checkbox'
                    checked={!!filters?.hasAvatar}
                    onChange={e => setFilter('hasAvatar', e.target.checked)}
                    className='accent-indigo-600'
                  />
                  <label
                    htmlFor='hasAvatar'
                    className='text-sm text-gray-700 select-none'
                  >
                    Has avatar
                  </label>
                </div>
              </div>
            </div>

            <div className='mt-3 flex justify-end gap-2'>
              <button
                type='button'
                onClick={() => {
                  onFiltersChange?.({});
                  setOpen(false);
                }}
                className='rounded-xl border px-3 py-2 text-sm hover:bg-gray-50'
              >
                Reset
              </button>
              <button
                type='button'
                onClick={() => {
                  setOpen(false);
                  onSubmit?.();
                }}
                className='rounded-xl px-4 py-2 text-sm text-white
                           bg-gradient-to-r from-[#9e55f7] to-[#447aee] hover:opacity-95 active:opacity-90'
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
