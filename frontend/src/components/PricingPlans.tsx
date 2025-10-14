// src/components/PricingPlans.tsx

type Plan = {
  name: string;
  price: string;
  period?: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string };
  highlight?: boolean; // best value badge
};

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    tagline: 'Get started & try Streakling',
    features: [
      'Digital Card (basic)',
      '1 Portfolio project',
      'Join public challenges',
      'Standard listing'
    ],
    cta: { label: 'Start for free', href: '/signup' }
  },
  {
    name: 'Starter',
    price: '$9',
    period: '/mo',
    tagline: 'Grow your presence',
    features: [
      'Digital Card (custom theme)',
      'Up to 10 projects',
      'Challenge submissions + badges',
      'Priority discovery'
    ],
    cta: { label: 'Upgrade to Starter', href: '/billing?plan=starter' }
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/mo',
    tagline: 'Best for active creators',
    features: [
      'Advanced Card customization',
      'Unlimited projects',
      'Featured placement on explore',
      'Analytics & link tracking'
    ],
    cta: { label: 'Go Pro', href: '/billing?plan=pro' },
    highlight: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    tagline: 'Teams & brands at scale',
    features: [
      'Team workspaces',
      'SAML SSO & roles',
      'Premium support',
      'Custom integrations'
    ],
    cta: { label: 'Contact sales', href: '/contact' }
  }
];

export default function PricingPlans() {
  return (
    <section
      id='pricing'
      className='mx-auto max-w-6xl px-4 py-12 sm:py-16 md:py-20'
      aria-label='Pricing plans'
    >
      <div className='mx-auto mb-10 max-w-2xl text-center'>
        <h2 className='text-3xl sm:text-4xl font-bold tracking-tight'>
          Simple pricing for every creator
        </h2>
        <p className='mt-3 text-[15px] leading-7 opacity-80'>
          Start free and scale as you grow. Cancel anytime.
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {PLANS.map(p => (
          <article
            key={p.name}
            className={[
              'relative rounded-2xl border p-6 backdrop-blur-sm transition',
              'bg-white/5 border-white/15 hover:bg-white/10',
              p.highlight ? 'ring-2 ring-[color:var(--color-primary)]' : ''
            ].join(' ')}
          >
            {p.highlight && (
              <span className='absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[color:var(--color-primary)] px-3 py-1 text-xs font-semibold text-white shadow'>
                Best value
              </span>
            )}
            <h3 className='text-xl font-semibold'>{p.name}</h3>
            <p className='mt-1 text-sm opacity-80'>{p.tagline}</p>

            <div className='mt-5 flex items-end gap-1'>
              <span className='text-4xl font-extrabold'>{p.price}</span>
              {p.period && (
                <span className='pb-1 text-sm opacity-70'>{p.period}</span>
              )}
            </div>

            <ul className='mt-5 space-y-2 text-[15px]'>
              {p.features.map(f => (
                <li key={f} className='flex items-start gap-2'>
                  <svg
                    className='mt-1 h-4 w-4 shrink-0'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth={2}
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden
                  >
                    <path d='M20 6 9 17l-5-5' />
                  </svg>
                  <span className='opacity-90'>{f}</span>
                </li>
              ))}
            </ul>

            <a
              href={p.cta.href}
              className={[
                'mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition',
                p.highlight
                  ? 'bg-[color:var(--color-primary)] text-white hover:opacity-90'
                  : 'border border-white/20 text-white/95 hover:bg-white/10'
              ].join(' ')}
            >
              {p.cta.label}
            </a>
          </article>
        ))}
      </div>

      {/* tiny footnote */}
      <p className='mt-6 text-center text-xs opacity-70'>
        Prices in USD. Taxes may apply. You can switch or cancel anytime.
      </p>
    </section>
  );
}
