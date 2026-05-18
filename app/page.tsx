import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper-warm px-6">
      <div className="max-w-xl text-center fade-up">
        <div className="text-6xl mb-6">📅</div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink mb-3">
          Planner
        </h1>
        <p className="text-ink-light text-lg mb-8">
          Calendars, daily to-dos, and goals.<br />
          One workspace, every device.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/auth/signup" className="btn-primary">Get started</Link>
          <Link href="/auth/login" className="btn border border-paper-line">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
