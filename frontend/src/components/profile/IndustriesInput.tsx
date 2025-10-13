'use client';

import * as React from 'react';
import { useMemo } from 'react';
import {
  Autocomplete,
  Chip,
  TextField,
  type AutocompleteRenderGetTagProps
} from '@mui/material';

// You can move this to a constants file if you like.
const INDUSTRY_OPTIONS: string[] = [
  'technology',
  'software',
  'design',
  'marketing',
  'finance',
  'education',
  'healthcare',
  'gaming',
  'photography',
  'music',
  'film',
  'fashion',
  'food',
  'travel',
  'sports',
  'writing',
  'consulting',
  'manufacturing',
  'real-estate',
  'nonprofit'
];

export type IndustriesInputProps = {
  value?: string[]; // current slugs
  onChange?: (v: string[]) => void; // callback with slugs
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-') // spaces/underscores -> dash
    .replace(/[^a-z0-9-]/g, '') // only keep slug-safe chars
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/(^-|-$)/g, ''); // no leading/trailing dash
}

export default function IndustriesInput({
  value = [],
  onChange,
  label = 'Industries',
  placeholder = 'Type to search or add your own…',
  disabled
}: IndustriesInputProps) {
  // Normalized & unique set from props
  const normalized = useMemo(
    () => Array.from(new Set(value.map(slugify))).filter(Boolean),
    [value]
  );

  // Merged list for suggestions: curated options + current selections
  const options = useMemo(() => {
    const merged = new Set([...INDUSTRY_OPTIONS.map(slugify), ...normalized]);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [normalized]);

  return (
    <Autocomplete
      multiple
      freeSolo
      disableCloseOnSelect
      filterSelectedOptions
      options={options}
      value={normalized}
      onChange={(_, items) => {
        // items can include raw strings typed by the user
        const next = Array.from(new Set(items.map(slugify))).filter(Boolean);
        onChange?.(next);
      }}
      renderTags={(
        tagValue: readonly string[],
        getTagProps: AutocompleteRenderGetTagProps
      ) =>
        tagValue.map((option: string, index: number) => {
          const tagProps = getTagProps({ index });
          return (
            <Chip
              {...tagProps}
              key={`${option}-${index}`} // ensure unique keys
              label={option}
              size='small'
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiChip-deleteIcon': { color: 'primary.contrastText' }
              }}
            />
          );
        })
      }
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          disabled={disabled}
          helperText='Pick from the list or press Enter/Comma to add your own.'
        />
      )}
      // Add values quickly when users type a comma
      onInputChange={(_, input) => {
        // If they type a trailing comma, commit the token
        if (input.endsWith(',')) {
          const token = slugify(input.slice(0, -1));
          if (token) {
            const next = Array.from(new Set([...normalized, token]));
            onChange?.(next);
          }
        }
      }}
    />
  );
}
