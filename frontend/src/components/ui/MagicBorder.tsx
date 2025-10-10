'use client';

import * as React from 'react';

type Props = {
  className?: string; // e.g. "h-full"
  radius?: string; // e.g. "rounded-2xl"
  children: React.ReactNode; // your card content
};

/**
 * Modern animated gradient BORDER (card stays still).
 * Smooth, long, eased animation with brand colors.
 * Requires @keyframes `border-pan` in globals.css.
 */
export default function MagicBorder({
  className,
  radius = 'rounded-2xl',
  children
}: Props) {
  return (
    <div
      className={[
        'relative p-[2px]', // border thickness
        radius,
        // smoother multi-stop gradient, large background, eased animation
        'bg-[linear-gradient(120deg,#9e55f7_0%,#7b39e8_15%,#447aee_45%,#2d69ea_60%,#13b9a3_85%,#9e55f7_100%)]',
        'bg-[length:400%_400%]',
        'animate-[border-pan_12s_ease-in-out_infinite]',
        // subtle modern shadow
        'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)]',
        className || ''
      ].join(' ')}
    >
      {/* Inner surface */}
      <div
        className={['h-full w-full bg-white', radius, 'overflow-hidden'].join(
          ' '
        )}
      >
        {children}
      </div>
    </div>
  );
}
