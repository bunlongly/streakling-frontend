'use client';

import { useEffect, useRef, useState } from 'react';

type QA = { q: string; a: string };

const FAQS: QA[] = [
  {
    q: 'What is a Digital Card?',
    a: 'It’s a scannable profile that centralizes your links, portfolio, and contact so collaborators get everything in one place.'
  },
  {
    q: 'Can I use Streakling for free?',
    a: 'Yes! The Free plan lets you create a basic Digital Card, add one portfolio project, and join public challenges.'
  },
  {
    q: 'What do I get with Pro?',
    a: 'Unlimited projects, advanced card customization, analytics & link tracking, and featured placement on Explore.'
  },
  {
    q: 'Can I change or cancel my plan anytime?',
    a: 'Absolutely. You can upgrade, downgrade, or cancel anytime from your billing settings. Changes apply to the next cycle.'
  },
  {
    q: 'Do you support teams or brands?',
    a: 'Yes—our Enterprise plan adds team workspaces, SAML SSO, roles/permissions, and custom integrations.'
  },
  {
    q: 'Do I need to upload videos for challenges?',
    a: 'You can submit a video link, a document, or an image. Your entry is attached to your profile for discovery.'
  }
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

/** Single accordion item with extra-smooth open/close */
function AccordionItem({
  q,
  a,
  defaultOpen = false,
  duration = 260
}: {
  q: string;
  a: string;
  defaultOpen?: boolean;
  duration?: number; // ms
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduced = usePrefersReducedMotion();
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  const id = `faq-${q.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  useEffect(() => {
    // Ensure starting height is correct for defaultOpen
    const outer = outerRef.current;
    if (!outer) return;
    if (open) outer.style.height = 'auto';
    else outer.style.height = '0px';
  }, [open]);

  const animate = (targetOpen: boolean) => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) {
      setOpen(targetOpen);
      return;
    }
    if (reduced) {
      setOpen(targetOpen);
      return;
    }

    // Prepare
    const startHeight = outer.getBoundingClientRect().height;
    // measure natural content height
    outer.style.height = 'auto';
    const endHeight = targetOpen ? outer.getBoundingClientRect().height : 0;
    // reset to start before animating
    outer.style.height = `${startHeight}px`;
    outer.style.overflow = 'hidden';
    outer.style.willChange = 'height';
    inner.style.willChange = 'opacity, transform';

    // Stagger writes with rAF to ensure browser treats it as a transition
    requestAnimationFrame(() => {
      outer.style.transition = `height ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
      inner.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
      if (targetOpen) {
        // opening: opacity 0 -> 1, y-1 -> 0
        inner.style.opacity = '1';
        inner.style.transform = 'translateY(0px)';
      } else {
        // closing: fade & lift a touch
        inner.style.opacity = '0';
        inner.style.transform = 'translateY(-4px)';
      }
      outer.style.height = `${endHeight}px`;

      const clean = () => {
        outer.removeEventListener('transitionend', clean);
        outer.style.transition = '';
        outer.style.overflow = '';
        outer.style.willChange = '';
        inner.style.transition = '';
        inner.style.willChange = '';
        // When fully open, let height be auto so dynamic content can grow
        if (targetOpen) {
          outer.style.height = 'auto';
        } else {
          // keep collapsed styles tidy
          outer.style.height = '0px';
        }
        setOpen(targetOpen);
      };
      outer.addEventListener('transitionend', clean, { once: true });
    });
  };

  return (
    <div
      className='rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm transition hover:bg-white/10'
      data-open={open}
    >
      {/* Header */}
      <button
        type='button'
        aria-expanded={open}
        aria-controls={id}
        onClick={() => animate(!open)}
        className='flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left'
      >
        <h3 className='text-base sm:text-lg font-semibold'>{q}</h3>
        <svg
          className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
            open ? 'rotate-45' : ''
          }`}
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          aria-hidden
        >
          <path d='M12 5v14' />
          <path d='M5 12h14' />
        </svg>
      </button>

      {/* Animated outer wrapper (height) */}
      <div
        id={id}
        ref={outerRef}
        style={{
          height: defaultOpen ? 'auto' : '0px'
          // initial states for inner animation
        }}
        className='px-5'
        role='region'
        aria-hidden={!open}
      >
        {/* Inner wrapper (opacity/translate) */}
        <div
          ref={innerRef}
          style={{
            opacity: defaultOpen ? 1 : 0,
            transform: defaultOpen ? 'translateY(0px)' : 'translateY(-4px)'
          }}
          className='pb-5'
        >
          <p className='text-[15px] leading-7 opacity-80'>{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <section
      id='faq'
      aria-label='Frequently Asked Questions'
      className='mx-auto max-w-4xl px-4 py-12 sm:py-16 md:py-20'
    >
      <div className='mx-auto mb-10 max-w-2xl text-center'>
        <h2 className='text-3xl sm:text-4xl font-bold tracking-tight'>FAQs</h2>
        <p className='mt-3 text-[15px] leading-7 opacity-80'>
          Quick answers to common questions. Still curious?{' '}
          <a
            href='/contact'
            className='underline decoration-white/40 hover:decoration-white'
          >
            Contact us
          </a>
          .
        </p>
      </div>

      <div className='space-y-3'>
        {FAQS.map((item, i) => (
          <AccordionItem
            key={item.q}
            q={item.q}
            a={item.a}
            defaultOpen={i === 0}
          />
        ))}
      </div>

      <p className='mt-6 text-center text-xs opacity-70'>
        Don’t see your question? We usually reply within 1–2 business days.
      </p>
    </section>
  );
}
