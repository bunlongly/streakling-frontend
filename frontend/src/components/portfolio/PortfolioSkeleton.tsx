'use client';

export default function PortfolioSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="aspect-[16/9] w-full bg-gray-100 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-5 w-14 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-5 w-12 rounded-full bg-gray-200 animate-pulse" />
        </div>
        <div className="h-8 w-20 rounded-lg bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}
