'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, subDays, parseISO, isSameDay } from 'date-fns';
import { Plus, X, Flame, Check, Trash2, Edit3 } from 'lucide-react';
import { computeStreak } from '@/lib/utils';

type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  position: number;
  archived: boolean;
};

type Checkin = { id: string; habit_id: string; day: string };

const ICONS = ['💪', '📚', '🧘', '🏊', '🏃', '✍️', '🎸', '🍎', '💧', '😴', '🧠', '🎨', '🎯', '⏰', '🌱', '✨'];
const COLORS = ['#2383e2', '#9065b0', '#0f7b6c', '#d44c47', '#cb912f', '#e07c44', '#5a8fc1', '#a64d79'];

export default function HabitsPage() {
  const supabase = createClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('✨');
  const [color, setColor] = useState('#2383e2');

  useEffect(() => {
    (async () => {
      const [h, c] = await Promise.all([
        supabase.from('habits').select('*').eq('archived', false).order('position'),
        supabase.from('habit_checkins').select('*'),
      ]);
      setHabits(h.data ?? []);
      setCheckins(c.data ?? []);
    })();
  }, []);

  async function addHabit() {
    if (!name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        name: name.trim(),
        icon,
        color,
        position: habits.length,
      })
      .select()
      .single();
    if (data) setHabits([...habits, data]);
    setName('');
    setIcon('✨');
    setColor('#2383e2');
    setShowForm(false);
  }

  async function deleteHabit(id: string) {
    if (!confirm('Delete this habit and all check-ins?')) return;
    setHabits(habits.filter((h) => h.id !== id));
    setCheckins(checkins.filter((c) => c.habit_id !== id));
    await supabase.from('habits').delete().eq('id', id);
  }

  async function toggleCheckin(habitId: string, day: string) {
    const existing = checkins.find((c) => c.habit_id === habitId && c.day === day);
    if (existing) {
      setCheckins(checkins.filter((c) => c.id !== existing.id));
      await supabase.from('habit_checkins').delete().eq('id', existing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('habit_checkins')
        .insert({ user_id: user.id, habit_id: habitId, day })
        .select()
        .single();
      if (data) setCheckins([...checkins, data]);
    }
  }

  const last30 = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-12 fade-up">
      <header className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-main">Habits</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-accent">
          <Plus size={14} /> New habit
        </button>
      </header>

      {showForm && (
        <div className="card p-4 mb-6 space-y-3 fade-up">
          <input
            autoFocus
            className="input"
            placeholder="Habit name (e.g. Practice piano)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <div className="text-xs text-muted mb-2">Icon</div>
            <div className="flex flex-wrap gap-1">
              {ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className="w-9 h-9 rounded-md text-lg flex items-center justify-center transition-all"
                  style={{
                    background: icon === i ? 'var(--accent-soft)' : 'var(--surface)',
                    border: '1px solid',
                    borderColor: icon === i ? 'var(--accent)' : 'transparent',
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted mb-2">Color</div>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform"
                  style={{
                    background: c,
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: color === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addHabit} className="btn-accent flex-1 justify-center py-2.5">Add habit</button>
            <button onClick={() => setShowForm(false)} className="btn">Cancel</button>
          </div>
        </div>
      )}

      {habits.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Flame size={32} className="mx-auto mb-3 text-faint" />
          <p className="text-faint">No habits yet. Build one to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {habits.map((h) => {
          const habitDays = checkins.filter((c) => c.habit_id === h.id).map((c) => c.day);
          const { current, longest } = computeStreak(habitDays);
          const last30Set = new Set(habitDays);
          return (
            <div key={h.id} className="card p-4 group">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ background: h.color + '22' }}
                >
                  {h.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-main truncate">{h.name}</div>
                  <div className="flex items-center gap-3 text-xs text-faint mt-0.5">
                    <span className="flex items-center gap-1">
                      <Flame size={11} style={{ color: current > 0 ? h.color : undefined }} />
                      {current} day streak
                    </span>
                    <span>Best: {longest}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteHabit(h.id)}
                  className="opacity-0 group-hover:opacity-100 text-faint"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex gap-0.5 overflow-x-auto">
                {last30.map((d) => {
                  const checked = last30Set.has(d);
                  const isToday = d === today;
                  return (
                    <button
                      key={d}
                      onClick={() => toggleCheckin(h.id, d)}
                      title={format(parseISO(d), 'MMM d')}
                      className="shrink-0 rounded transition-all hover:scale-110"
                      style={{
                        width: '14px',
                        height: '24px',
                        background: checked ? h.color : 'var(--surface-2)',
                        border: isToday ? `1.5px solid ${h.color}` : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
