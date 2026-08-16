import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-script text-3xl text-[var(--brand)]">watchamoo</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight">Page not found</h1>
      <p className="mt-3 text-[var(--muted-foreground)]">
        That link does not match a page in the pilot. Try Discover or head home.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Home
        </Link>
        <Link href="/discover" className="btn btn-secondary">
          Discover
        </Link>
      </div>
    </div>
  );
}
