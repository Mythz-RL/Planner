'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Plus, Check } from 'lucide-react';

type Calendar = { id: string; name: string; color: string };
type Event = { id: string; title: string; start_time: string | null; calendar_id: string };
type Todo = { id: string; content: string; done: boolean; position: number };

export default function TodayPage() {
  const supabase = createClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDisplay = format(new Date(), 'EEEE, MMMM d');

  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from('calendars').select('*');
      const { data: e } = await supabase
        .from('events')
        .select('*')
        .lte('start_date', today)
        .or(`end_date.gte.${today},and(end_date.is.null,start_date.eq.${today})`);
      const { data: t } = await supabase
        .from('todos')
        .select('*')
        .eq('day', today)
        .order('position');
      setCalendars(c ?? []);
      setEvents((e ?? []).filter((ev: any) => ev.start_date === today));
      setTodos(t ?? []);
    })();
  }, []);

  async function addTodo() {
    if (!newTodo.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        day: today,
        content: newTodo.trim(),
        position: todos.length,
      })
      .select()
      .single();
    if (data) setTodos([...todos, data]);
    setNewTodo('');
  }

  async function toggleTodo(t: Todo) {
    const next = !t.done;
    setTodos(todos.map((x) => (x.id === t.id ? { ...x, done: next } : x)));
    await supabase.from('todos').update({ done: next }).eq('id', t.id);
  }

  const colorOf = (id: string) =>
    calendars.find((c) => c.id === id)?.color ?? '#9b9a97';

  const done = todos.filter((t) => t.done).length;

  return (
    <div className="max-w-3xl mx-auto px-8 py-12 fade-up">
      <div className="mb-10">
        <div className="text-sm text-ink-faint mb-1">{todayDisplay}</div>
        <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
      </div>

      {/* Events */}
      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-wider text-ink-faint mb-3">
          Today's events
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-ink-light italic">Nothing scheduled.</p>
        ) : (
          <ul className="space-y-1">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-paper-muted"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: colorOf(e.calendar_id) }}
                />
                <span className="text-sm">{e.title}</span>
                {e.start_time && (
                  <span className="text-xs text-ink-faint ml-auto">
                    {e.start_time.slice(0, 5)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Todos */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-ink-faint">
            To-do
          </h2>
          {todos.length > 0 && (
            <span className="text-xs text-ink-faint">
              {done} / {todos.length} done
            </span>
          )}
        </div>

        <ul className="space-y-0.5 mb-2">
          {todos.map((t) => (
            <li
              key={t.id}
              className="group flex items-center gap-2.5 px-2 py-1 rounded hover:bg-paper-muted"
            >
              <button
                onClick={() => toggleTodo(t)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  t.done
                    ? 'bg-ink border-ink text-white'
                    : 'border-paper-line hover:border-ink-light'
                }`}
              >
                {t.done && <Check size={11} strokeWidth={3} />}
              </button>
              <span
                className={`text-sm flex-1 ${
                  t.done ? 'line-through text-ink-faint' : ''
                }`}
              >
                {t.content}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 px-2">
          <Plus size={14} className="text-ink-faint" />
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a to-do..."
            className="flex-1 bg-transparent text-sm py-1 placeholder:text-ink-faint"
          />
        </div>
      </section>
    </div>
  );
}
