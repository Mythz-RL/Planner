'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Plus, X, Minus } from 'lucide-react';

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
    setTitle('');
    setTarget(100);
    setDeadline('');
    setShowForm(false);
  }

  async function updateProgress(g: Goal, delta: number) {
    const next = Math.max(0, Math.min(g.target, g.progress + delta));
    setGoals(goals.map((x) => (x.id === g.id ? { ...x, progress: next } : x)));
    await supabase.from('goals').update({ progress: next }).eq('id', g.id);
  }

  async function deleteGoal(id: string) {
    setGoals(goals.filter((g) => g.id !== id));
    await supabase.from('goals').delete().eq('id', id);
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-12 fade-up">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">Goals</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
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
            <button onClick={addGoal} className="btn-primary flex-1 justify-center">
              Add
            </button>
            <button onClick={() => setShowForm(false)} className="btn">
              Cancel
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 && !showForm && (
        <p className="text-ink-faint italic text-sm">No goals yet. Add one to get started.</p>
      )}

      <div className="space-y-4">
        {goals.map((g) => {
          const pct = Math.round((g.progress / g.target) * 100);
          const complete = pct >= 100;
          return (
            <div key={g.id} className="card p-4 group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className={`font-medium ${complete ? 'text-ink-faint line-through' : ''}`}>
                    {g.title}
                  </h3>
                  {g.deadline && (
                    <div className="text-xs text-ink-faint mt-0.5">
                      Due {format(new Date(g.deadline), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-accent-personal"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => updateProgress(g, -1)}
                  className="w-7 h-7 rounded border border-paper-line hover:bg-paper-muted flex items-center justify-center"
                >
                  <Minus size={12} />
                </button>
                <div className="flex-1">
                  <div className="h-2 bg-paper-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        complete ? 'bg-accent-sports' : 'bg-ink'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-ink-faint">
                    <span>{g.progress} / {g.target}</span>
                    <span>{pct}%</span>
                  </div>
                </div>
                <button
                  onClick={() => updateProgress(g, 1)}
                  className="w-7 h-7 rounded border border-paper-line hover:bg-paper-muted flex items-center justify-center"
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
