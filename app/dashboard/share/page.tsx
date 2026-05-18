'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Copy, Trash2 } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto px-8 py-12 fade-up">
      <h1 className="text-3xl font-semibold mb-2">Share with parents</h1>
      <p className="text-ink-light mb-8 text-sm">
        Generate a read-only link that shows only your <strong>School</strong> calendar.
        Other calendars (Debate, Sports, Personal) stay private.
      </p>

      {!token ? (
        <button onClick={createLink} className="btn-primary">
          Create share link
        </button>
      ) : (
        <div className="card p-4 space-y-3">
          <div className="text-xs uppercase tracking-wider text-ink-faint">
            Your share link
          </div>
          <div className="flex items-center gap-2">
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
              className="btn-primary text-xs"
            >
              <Copy size={12} /> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={revoke}
            className="text-xs text-accent-personal hover:underline flex items-center gap-1"
          >
            <Trash2 size={12} /> Revoke link
          </button>
        </div>
      )}
    </div>
  );
}
