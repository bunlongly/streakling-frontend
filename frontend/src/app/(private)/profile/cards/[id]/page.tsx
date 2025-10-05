// src/app/(private)/profile/cards/[id]/page.tsx
import AuthGate from '@/components/AuthGate';
import ProfileCardForm from '@/components/digital-card/ProfileCardForm';
import DeleteCardButton from '@/components/digital-card/DeleteCardButton';
import { api } from '@/lib/api';
import { cookies } from 'next/headers';

async function getInitial(id: string) {
  // Forward the user’s cookies so your backend session works on the server
  const cookieHeader = cookies().toString();
  const res = await api.card.getById(id, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  } as any);
  return res.data; // ApiSuccess<DigitalCard> -> .data
}

export default async function EditCardPage({
  params
}: {
  params: { id: string };
}) {
  const { id } = params;
  const initial = await getInitial(id);

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
