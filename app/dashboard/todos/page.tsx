'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay,
} from 'date-fns';
import { Plus, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

type Todo = {
  id: string;
  day: string;
  content: string;
  done: boolean;
  position: number;
};

export default function TodosPage() {
  const supabase = createClient();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [todos, setTodos] = useState<Todo[]>([]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  useEffect(() => {
    (async () => {
      const start = format(weekStart, 'yyyy-MM-dd');
      const end = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('todos')
        .select('*')
        .gte('day', start)
        .lte('day', end)
        .order('position');
      setTodos(data ?? []);
    })();
  }, [weekStart]);

  async function addTodo(day: string, content: string) {
    if (!content.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const dayTodos = todos.filter((t) => t.day === day);
    const { data } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        day,
        content: content.trim(),
        position: dayTodos.length,
      })
      .select()
      .single();
    if (data) setTodos([...todos, data]);
  }

  async function toggleTodo(t: Todo) {
    const next = !t.done;
    setTodos(todos.map((x) => (x.id === t.id ? { ...x, done: next } : x)));
    await supabase.from('todos').update({ done: next }).eq('id', t.id);
  }

  async function deleteTodo(id: string) {
    setTodos(todos.filter((t) => t.id !== id));
    await supabase.from('todos').delete().eq('id', id);
  }

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto fade-up">
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="text-sm text-ink-faint mb-1">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </div>
          <h1 className="text-3xl font-semibold">Weekly to-dos</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="btn text-xs mr-2"
          >
            This week
          </button>
          <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="btn">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="btn">
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((d) => (
          <DayColumn
            key={d.toISOString()}
            day={d}
            todos={todos.filter((t) => t.day === format(d, 'yyyy-MM-dd'))}
            onAdd={(content) => addTodo(format(d, 'yyyy-MM-dd'), content)}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  day,
  todos,
  onAdd,
  onToggle,
  onDelete,
}: {
  day: Date;
  todos: Todo[];
  onAdd: (content: string) => void;
  onToggle: (t: Todo) => void;
  onDelete: (id: string) => void;
}) {
  const [input, setInput] = useState('');
  const isToday = isSameDay(day, new Date());
  const done = todos.filter((t) => t.done).length;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between pb-2 border-b border-paper-line">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-faint">
            {format(day, 'EEE')}
          </div>
          <div
            className={`text-lg font-medium ${
              isToday ? 'text-ink' : 'text-ink-light'
            }`}
          >
            {format(day, 'd')}
          </div>
        </div>
        {todos.length > 0 && (
          <span className="text-xs text-ink-faint">
            {done}/{todos.length}
          </span>
        )}
      </div>

      <ul className="space-y-0.5 min-h-[40px]">
        {todos.map((t) => (
          <li key={t.id} className="group flex items-start gap-2 py-0.5">
            <button
              onClick={() => onToggle(t)}
              className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                t.done
                  ? 'bg-ink border-ink text-white'
                  : 'border-paper-line hover:border-ink-light'
              }`}
            >
              {t.done && <Check size={11} strokeWidth={3} />}
            </button>
            <span
              className={`text-sm flex-1 break-words ${
                t.done ? 'line-through text-ink-faint' : ''
              }`}
            >
              {t.content}
            </span>
            <button
              onClick={() => onDelete(t.id)}
              className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-accent-personal mt-1"
            >
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-1.5 text-ink-faint">
        <Plus size={12} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdd(input);
              setInput('');
            }
          }}
          placeholder="Add..."
          className="flex-1 bg-transparent text-sm py-0.5 placeholder:text-ink-faint"
        />
      </div>
    </div>
  );
}
