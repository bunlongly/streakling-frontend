'use client';

export default function CardSkeleton() {
  return (
    <div className='h-[320px] rounded-2xl overflow-hidden bg-white shadow-sm'>
      <div className='h-28 w-full bg-gray-100 animate-pulse' />
      <div className='p-4'>
        <div className='-mt-12 mb-2 flex justify-center'>
          <div className='h-16 w-16 rounded-full ring-4 ring-white bg-gray-200 animate-pulse' />
        </div>

        <div className='space-y-3 text-center'>
          <div className='h-3 w-24 mx-auto bg-gray-200 rounded animate-pulse' />
          <div className='h-4 w-40 mx-auto bg-gray-200 rounded animate-pulse' />
          <div className='h-3 w-32 mx-auto bg-gray-200 rounded animate-pulse' />
        </div>

        <div className='mt-6 h-9 w-48 mx-auto bg-gray-200 rounded-lg animate-pulse' />
      </div>
    </div>
  );
}
