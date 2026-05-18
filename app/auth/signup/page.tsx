'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setMsg('Check your email to confirm your account, then sign in.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 surface">
      <div className="card w-full max-w-sm p-7 fade-up">
        <h1 className="text-2xl font-semibold mb-1 text-main">Create your account</h1>
        <p className="text-muted text-sm mb-6">Start planning in 30 seconds</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted mb-1.5 block">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Password</label>
            <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {err && <p className="text-sm" style={{ color: 'var(--danger)' }}>{err}</p>}
          {msg && <p className="text-sm" style={{ color: 'var(--success)' }}>{msg}</p>}
          <button className="btn-accent w-full justify-center py-2.5" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          Already have one?{' '}
          <Link href="/auth/login" className="hover:underline" style={{ color: 'var(--accent)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
