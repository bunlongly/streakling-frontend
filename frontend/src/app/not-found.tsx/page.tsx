// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you’re looking for doesn’t exist.
        </p>
        <Link href="/" className="underline">
          Go back home
        </Link>
      </div>
    </main>
  );
}
