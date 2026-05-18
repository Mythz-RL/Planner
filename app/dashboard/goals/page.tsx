'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Plus, X, Minus, Target, Trophy } from 'lucide-react';

type Goal = {
  id: string;
  title: string;
  description: string | null;
  target: number;
  progress: number;
  deadline: string | null;
};

export default function GoalsPage() {
  const supabase = createClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(100);
  const [deadline, setDeadline] = useState('');
  const [confettiId, setConfettiId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
      setGoals(data ?? []);
    })();
  }, []);

  async function addGoal() {
    if (!title.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: title.trim(),
        target: target || 100,
        deadline: deadline || null,
      })
      .select()
      .single();
    if (data) setGoals([data, ...goals]);
    setTitle(''); setTarget(100); setDeadline(''); setShowForm(false);
  }

  async function updateProgress(g: Goal, delta: number) {
    const next = Math.max(0, Math.min(g.target, g.progress + delta));
    const wasComplete = g.progress >= g.target;
    const nowComplete = next >= g.target;
    setGoals(goals.map((x) => (x.id === g.id ? { ...x, progress: next } : x)));
    await supabase.from('goals').update({ progress: next }).eq('id', g.id);
    if (!wasComplete && nowComplete) {
      setConfettiId(g.id);
      setTimeout(() => setConfettiId(null), 1000);
    }
  }

  async function deleteGoal(id: string) {
    setGoals(goals.filter((g) => g.id !== id));
    await supabase.from('goals').delete().eq('id', id);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-12 fade-up">
      <header className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-main">Goals</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-accent">
          <Plus size={14} /> New goal
        </button>
      </header>

      {showForm && (
        <div className="card p-4 mb-6 space-y-2 fade-up">
          <input
            autoFocus
            className="input"
            placeholder="Goal title (e.g. Read 12 books)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              className="input w-32"
              placeholder="Target"
              value={target}
              onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
            />
            <input
              type="date"
              className="input flex-1"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addGoal} className="btn-accent flex-1 justify-center py-2.5">Add</button>
            <button onClick={() => setShowForm(false)} className="btn">Cancel</button>
          </div>
        </div>
      )}

      {goals.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Target size={32} className="mx-auto mb-3 text-faint" />
          <p className="text-faint">No goals yet. Add one to get started.</p>
        </div>
      )}

      <div className="space-y-4">
        {goals.map((g) => {
          const pct = Math.round((g.progress / g.target) * 100);
          const complete = pct >= 100;
          return (
            <div key={g.id} className="card p-4 group relative overflow-hidden">
              {confettiId === g.id && <Confetti />}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 flex items-center gap-2">
                  {complete && <Trophy size={16} style={{ color: 'var(--success)' }} />}
                  <h3 className="font-medium text-main">{g.title}</h3>
                </div>
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="opacity-0 group-hover:opacity-100 text-faint"
                >
                  <X size={14} />
                </button>
              </div>
              {g.deadline && (
                <div className="text-xs text-faint mb-2">
                  Due {format(new Date(g.deadline), 'MMM d, yyyy')}
                </div>
              )}

              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => updateProgress(g, -1)}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:surface-2"
                  style={{ border: '1px solid var(--line)' }}
                >
                  <Minus size={12} />
                </button>
                <div className="flex-1">
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        background: complete ? 'var(--success)' : 'var(--accent)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-faint">
                    <span>{g.progress} / {g.target}</span>
                    <span>{pct}%</span>
                  </div>
                </div>
                <button
                  onClick={() => updateProgress(g, 1)}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:surface-2"
                  style={{ border: '1px solid var(--line)' }}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const dist = 80 + Math.random() * 60;
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#9b6df0', '#ff9f43'];
    return {
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      rot: Math.random() * 720 - 360,
      color: colors[i % colors.length],
      delay: Math.random() * 100,
    };
  });
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            background: p.color,
            ['--tx' as any]: `${p.tx}px`,
            ['--ty' as any]: `${p.ty}px`,
            ['--rot' as any]: `${p.rot}deg`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
