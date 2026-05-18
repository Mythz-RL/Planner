import Link from 'next/link';
import { Calendar, CheckSquare, Target, Flame } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--surface)' }}>
      <div className="max-w-xl w-full text-center fade-up">
        <div className="flex justify-center gap-2 mb-6">
          {[Calendar, CheckSquare, Target, Flame].map((Icon, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-xl flex items-center justify-center pop"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                animationDelay: `${i * 60}ms`,
              }}
            >
              <Icon size={22} style={{ color: 'var(--accent)' }} />
            </div>
          ))}
        </div>
        <h1 className="text-5xl font-semibold tracking-tight mb-3 text-main">
          Planner
        </h1>
        <p className="text-muted text-lg mb-8 max-w-md mx-auto">
          Calendars, daily to-dos, habits, and goals.
          <br />
          One workspace, every device.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/auth/signup" className="btn-accent text-base px-5 py-2.5">
            Get started
          </Link>
          <Link href="/auth/login" className="btn text-base px-5 py-2.5" style={{ border: '1px solid var(--line)' }}>
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
