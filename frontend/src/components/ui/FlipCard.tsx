'use client';

import * as React from 'react';

type FlipCardProps = {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  initialFlipped?: boolean; // optional default
};

// Consider these elements "interactive" so clicking them doesn't flip back.
function isInteractive(el: EventTarget | null) {
  if (!(el instanceof Element)) return false;
  return !!el.closest(
    'a,button,[role="button"],input,textarea,select,[data-stopflip="true"]'
  );
}

export default function FlipCard({
  front,
  back,
  className,
  initialFlipped = false
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = React.useState(initialFlipped);

  return (
    <div className={`group relative [perspective:1000px] ${className ?? ''}`}>
      {/* FRONT overlay: click/tap anywhere to flip forward */}
      {!isFlipped && (
        <button
          type='button'
          aria-label='Flip card'
          onClick={() => setIsFlipped(true)}
          className='absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500'
        />
      )}

      <div
        className={`
          relative h-full w-full transition-transform duration-500
          [transform-style:preserve-3d]
          ${isFlipped ? '[transform:rotateY(180deg)]' : ''}
          motion-reduce:transition-none motion-reduce:[transform:none]
        `}
      >
        {/* FRONT */}
        <div className='absolute inset-0 [backface-visibility:hidden]'>
          {front}
        </div>

        {/* BACK */}
        <div
          className='absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]'
          // Use CAPTURE so we always see the click first (even if children stop propagation).
          onClickCapture={e => {
            if (!isInteractive(e.target)) setIsFlipped(false);
          }}
          aria-label='Flip back'
        >
          {back}
        </div>
      </div>
    </div>
  );
}
