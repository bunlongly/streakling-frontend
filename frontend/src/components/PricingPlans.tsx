'use client';

import { Check, Star } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { motion } from 'framer-motion';

/**
 * Streakling Pricing Table — v2
 * Tweaks from feedback:
 * - Section heading is BLACK for better contrast
 * - Stronger brand gradient borders (primary/secondary/tertiary mix)
 * - Featured (Recommended) card is slightly larger and more prominent
 * - Cleaner, more professional spacing/typography
 */

export type Plan = {
  id: string;
  name: string;
  price: string; // "$0", "$7.99", etc.
  period?: string; // "/month" (optional)
  blurb?: string;
  featured?: boolean; // Recommended
  ctaLabel?: string;
  ctaHref?: string;
  quota: {
    digitalCards: number;
    portfolios: number;
    canJoinChallenges: boolean;
    canCreateChallenges?: number; // count (0 for none)
  };
};

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Trial',
    price: '$0',
    period: '/month',
    blurb: 'Try Streakling with essential limits.',
    ctaLabel: 'Start for free',
    ctaHref: '/signup',
    quota: {
      digitalCards: 1,
      portfolios: 1,
      canJoinChallenges: true,
      canCreateChallenges: 0
    }
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$7.99',
    period: '/month',
    blurb: 'More room to build your profile.',
    ctaLabel: 'Choose Basic',
    ctaHref: '/billing/subscribe?plan=basic',
    quota: {
      digitalCards: 3,
      portfolios: 3,
      canJoinChallenges: true,
      canCreateChallenges: 2
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$11.99',
    period: '/month',
    blurb: 'Best value for active creators.',
    featured: true,
    ctaLabel: 'Go Pro',
    ctaHref: '/billing/subscribe?plan=pro',
    quota: {
      digitalCards: 5,
      portfolios: 5,
      canJoinChallenges: true,
      canCreateChallenges: 5
    }
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: '$14.99',
    period: '/month',
    blurb: 'Maximum flexibility and capacity.',
    ctaLabel: 'Choose Ultimate',
    ctaHref: '/billing/subscribe?plan=ultimate',
    quota: {
      digitalCards: 7,
      portfolios: 7,
      canJoinChallenges: true,
      canCreateChallenges: 7
    }
  }
];

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className='flex items-start gap-2 leading-relaxed'>
      <Check className='mt-0.5 h-4 w-4' aria-hidden />
      <span>{children}</span>
    </li>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const isFeatured = plan.featured;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.35 }}
      className={clsx(
        'relative rounded-3xl p-[2px]',
        // Stronger brand gradient border
        'bg-[conic-gradient(at_10%_10%,#9e55f7, #447aee, #13b9a3, #9e55f7)]',
        isFeatured
          ? 'shadow-2xl shadow-purple-400/25'
          : 'shadow-lg shadow-black/10',
        isFeatured && 'md:scale-[1.03]'
      )}
    >
      {/* Inner card */}
      <div
        className={clsx(
          'rounded-3xl h-full w-full',
          'bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80',
          'dark:bg-neutral-900/70',
          'ring-1 ring-black/5'
        )}
      >
        {/* Ribbon */}
        {isFeatured && (
          <div className='absolute -top-4 right-4 inline-flex items-center gap-1 rounded-full bg-[#9e55f7] px-4 py-1.5 text-sm font-semibold text-white shadow-lg'>
            <Star className='h-4 w-4' aria-hidden /> Recommended
          </div>
        )}

        <div className={clsx('flex h-full flex-col p-7', isFeatured && 'pt-9')}>
          <div className='mb-4'>
            <h3 className='text-xl font-semibold tracking-tight text-black dark:text-white'>
              {plan.name}
            </h3>
            {plan.blurb && (
              <p className='mt-1 text-sm text-gray-700 dark:text-gray-300'>
                {plan.blurb}
              </p>
            )}
          </div>

          <div className='mb-6 flex items-end gap-1'>
            <span
              className={clsx(
                'text-4xl font-extrabold leading-none',
                isFeatured ? 'text-[#9e55f7]' : 'text-black dark:text-white'
              )}
            >
              {plan.price}
            </span>
            {plan.period && (
              <span className='pb-1 text-sm text-gray-500'>{plan.period}</span>
            )}
          </div>

          <ul className='mb-8 grid gap-2.5 text-[0.95rem] text-gray-900 dark:text-gray-100'>
            <Feature>
              {plan.quota.digitalCards} digital{' '}
              {plan.quota.digitalCards === 1 ? 'name card' : 'name cards'}
            </Feature>
            <Feature>
              {plan.quota.portfolios}{' '}
              {plan.quota.portfolios === 1 ? 'portfolio' : 'portfolios'}
            </Feature>
            <Feature>
              {plan.quota.canJoinChallenges
                ? 'Join challenges'
                : 'Cannot join challenges'}
            </Feature>
            {typeof plan.quota.canCreateChallenges === 'number' && (
              <Feature>
                Create {plan.quota.canCreateChallenges}{' '}
                {plan.quota.canCreateChallenges === 1
                  ? 'challenge'
                  : 'challenges'}
              </Feature>
            )}
          </ul>

          <div className='mt-auto'>
            {plan.ctaHref ? (
              <Link
                href={plan.ctaHref}
                className={clsx(
                  'inline-flex w-full items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-medium',
                  isFeatured
                    ? 'bg-gradient-to-r from-[#9e55f7] via-[#447aee] to-[#13b9a3] text-white shadow hover:opacity-95'
                    : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100'
                )}
              >
                {plan.ctaLabel ?? 'Select'}
              </Link>
            ) : (
              <button
                type='button'
                className={clsx(
                  'inline-flex w-full items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-medium',
                  isFeatured
                    ? 'bg-gradient-to-r from-[#9e55f7] via-[#447aee] to-[#13b9a3] text-white shadow hover:opacity-95'
                    : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100'
                )}
              >
                {plan.ctaLabel ?? 'Select'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PricingTable({
  plans = DEFAULT_PLANS
}: {
  plans?: Plan[];
}) {
  return (
    <section className='relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8'>
      {/* Soft background flourish */}
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10'>
        <div className='mx-auto h-72 w-72 -translate-y-8 rounded-full bg-[#9e55f7]/15 blur-3xl sm:h-96 sm:w-96' />
        <div className='mx-auto mt-[-4rem] h-72 w-72 rounded-full bg-[#447aee]/15 blur-3xl sm:h-96 sm:w-96' />
      </div>

      <div className='mx-auto mb-12 max-w-2xl text-center'>
        <h2 className='text-3xl font-extrabold tracking-tight text-black'>
          Simple, transparent pricing
        </h2>
        <p className='mt-2 text-base text-gray-700 '>
          Start free. Upgrade anytime. No hidden fees.
        </p>
      </div>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {plans.map(p => (
          <PlanCard key={p.id} plan={p} />
        ))}
      </div>

      {/* Tiny legal note */}
      <p className='mt-6 text-center text-xs text-gray-500'>
        Prices shown in USD per month. Taxes may apply.
      </p>
    </section>
  );
}
