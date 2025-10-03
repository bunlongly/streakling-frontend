import { api } from '@/lib/api';
import Image from 'next/image';

export const revalidate = 60;

export default async function PublicDigitalCardPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const card = await api.card
    .publicGetBySlug(slug)
    .then(r => r.data)
    .catch(() => null);

  if (!card) {
    return (
      <main className="min-h-dvh bg-brand-mix grid place-items-center p-6">
        <div className="card-surface p-8 text-center">
          <h1 className="text-2xl font-semibold">Profile not found</h1>
          <p className="mt-2 muted">No published card at /{slug}/digitalcard.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-brand-mix p-6">
      <section className="max-w-sm mx-auto card-surface p-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-24 w-24 rounded-full overflow-hidden ring-2 ring-[color:var(--color-accent)]">
            <Image src={card.avatarKey || '/favicon.ico'} alt="avatar" fill />
          </div>
          <h1 className="mt-4 text-xl font-semibold">
            {card.firstName} {card.lastName}
          </h1>
          <div className="muted">@{card.appName}</div>
          <div className="mt-1 inline-flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded-full border border-white/10">
              {card.status}
            </span>
            <span className="opacity-80">{card.role}</span>
          </div>

          <p className="mt-3 text-sm opacity-90">{card.shortBio}</p>

          <div className="mt-4 grid gap-1 text-sm opacity-80">
            {card.showCompany && card.company && <div>🏢 {card.company}</div>}
            {card.showUniversity && card.university && <div>🎓 {card.university}</div>}
            {card.showCountry && card.country && <div>🌍 {card.country}</div>}
            {card.showPhone && card.phone && <div>📞 {card.phone}</div>}
            {card.showReligion && card.religion && <div>🙏 {card.religion}</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
