// src/app/(private)/profile/cards/[id]/page.tsx
import AuthGate from '@/components/AuthGate';
import ProfileCardForm from '@/components/digital-card/ProfileCardForm';
import DeleteCardButton from '@/components/digital-card/DeleteCardButton';
import { api } from '@/lib/api';
import { cookies } from 'next/headers';
import type { DigitalCard } from '@/types/digitalCard';
import type {
  DigitalCardFormValues,
  SocialAccountForm
} from '@/schemas/digitalCard';

async function getInitial(id: string) {
  // Forward session cookies so your backend auth works from the server
  const cookieHeader = cookies().toString();

  const res = await api.card.getById(id, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  } satisfies RequestInit);

  return res.data as DigitalCard;
}

/** Convert API shape (nullables) -> form shape (undefined for empty) */
function toFormInitial(card: DigitalCard): Partial<DigitalCardFormValues> {
  const toUndef = <T,>(v: T | null | undefined): T | undefined =>
    v === null ? undefined : v;

  const socials: SocialAccountForm[] = (card.socials ?? []).map(s => ({
    id: s.id,
    platform: s.platform,
    handle: toUndef(s.handle),
    url: toUndef(s.url),
    label: toUndef(s.label),
    isPublic: s.isPublic,
    sortOrder: s.sortOrder
  }));

  return {
    // required fields from your schema
    slug: card.slug,
    firstName: card.firstName,
    lastName: card.lastName,
    appName: card.appName,
    role: card.role,
    status: card.status,
    publishStatus: card.publishStatus,
    shortBio: card.shortBio,

    // optional strings: null -> undefined for RHF + zod optional()
    company: toUndef(card.company),
    university: toUndef(card.university),
    country: toUndef(card.country),
    religion: toUndef(card.religion),
    phone: toUndef(card.phone),

    // visibility flags
    showPhone: card.showPhone,
    showReligion: card.showReligion,
    showCompany: card.showCompany,
    showUniversity: card.showUniversity,
    showCountry: card.showCountry,

    // media keys (null -> undefined)
    avatarKey: toUndef(card.avatarKey),
    bannerKey: toUndef(card.bannerKey),

    // socials coerced to the form type (no nulls)
    socials
  };
}

export default async function EditCardPage({
  // ✅ In Next.js 15, `params` is a Promise
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // or: const { use } = await import('react'); const { id } = use(params)
  const card = await getInitial(id);
  const initial: Partial<DigitalCardFormValues> = toFormInitial(card);

  return (
    <AuthGate>
      <div className='max-w-3xl mx-auto space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold'>Edit digital card</h1>
          <DeleteCardButton id={id} />
        </div>
        {/* Your form already supports edit mode when `id` is present */}
        <ProfileCardForm id={id} initial={initial} />
      </div>
    </AuthGate>
  );
}
