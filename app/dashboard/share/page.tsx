'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Copy, Trash2, Share2, Check } from 'lucide-react';

export default function SharePage() {
  const supabase = createClient();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('share_links').select('*').limit(1).maybeSingle();
      if (data) setToken(data.token);
    })();
  }, []);

  async function createLink() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const t = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    const { data } = await supabase
      .from('share_links')
      .insert({ token: t, user_id: user.id, scope: 'school' })
      .select()
      .single();
    if (data) setToken(data.token);
  }

  async function revoke() {
    if (!token) return;
    if (!confirm('Revoke the share link? Parents will lose access.')) return;
    await supabase.from('share_links').delete().eq('token', token);
    setToken(null);
  }

  const url = token && typeof window !== 'undefined'
    ? `${window.location.origin}/shared/${token}`
    : '';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-12 fade-up">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Share2 size={20} style={{ color: 'var(--accent)' }} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-main">Share with parents</h1>
        </div>
        <p className="text-muted text-sm">
          Generate a read-only link that shows only your <strong>School</strong> calendar.
          Debate, Sports, and Personal stay private.
        </p>
      </header>

      {!token ? (
        <button onClick={createLink} className="btn-accent">
          Create share link
        </button>
      ) : (
        <div className="card p-4 sm:p-5 space-y-3">
          <div className="text-xs uppercase tracking-wider text-faint">Your share link</div>
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input
              readOnly
              value={url}
              className="input flex-1 font-mono text-xs"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="btn-accent text-sm shrink-0 justify-center"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={revoke}
            className="text-xs hover:underline flex items-center gap-1"
            style={{ color: 'var(--danger)' }}
          >
            <Trash2 size={12} /> Revoke link
          </button>
        </div>
      )}
    </div>
  );
}
