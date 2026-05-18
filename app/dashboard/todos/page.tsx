'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay,
} from 'date-fns';
import { Plus, Check, X, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

type Todo = {
  id: string;
  day: string;
  content: string;
  done: boolean;
  position: number;
  parent_id: string | null;
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
    const dayTodos = todos.filter((t) => t.day === day && !t.parent_id);
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
    setTodos(todos.filter((t) => t.id !== id && t.parent_id !== id));
    await supabase.from('todos').delete().eq('id', id);
  }

  async function renameTodo(id: string, content: string) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, content } : t)));
    await supabase.from('todos').update({ content }).eq('id', id);
  }

  async function moveToDay(id: string, day: string) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, day } : t)));
    await supabase.from('todos').update({ day }).eq('id', id);
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto fade-up">
      <header className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <div className="text-sm text-faint mb-1">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-main">Weekly to-dos</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="btn text-xs mr-1 hidden sm:inline-flex"
          >
            This week
          </button>
          <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="btn"><ChevronLeft size={16} /></button>
          <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="btn"><ChevronRight size={16} /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 sm:gap-4">
        {days.map((d) => {
          const dayStr = format(d, 'yyyy-MM-dd');
          return (
            <DayColumn
              key={dayStr}
              day={d}
              todos={todos.filter((t) => t.day === dayStr && !t.parent_id)}
              subOf={(id) => todos.filter((t) => t.parent_id === id)}
              onAdd={(c) => addTodo(dayStr, c)}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onRename={renameTodo}
              onDrop={(id) => moveToDay(id, dayStr)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayColumn({
  day, todos, subOf, onAdd, onToggle, onDelete, onRename, onDrop,
}: {
  day: Date;
  todos: Todo[];
  subOf: (id: string) => Todo[];
  onAdd: (content: string) => void;
  onToggle: (t: Todo) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, content: string) => void;
  onDrop: (id: string) => void;
}) {
  const [input, setInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const isToday = isSameDay(day, new Date());
  const done = todos.filter((t) => t.done).length;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id) onDrop(id);
      }}
      className="space-y-2 rounded-lg p-2 transition-colors"
      style={{ background: dragOver ? 'var(--accent-soft)' : 'transparent' }}
    >
      <div className="flex items-baseline justify-between pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
        <div>
          <div className="text-xs uppercase tracking-wider text-faint">{format(day, 'EEE')}</div>
          <div className="text-lg font-medium" style={{ color: isToday ? 'var(--accent)' : 'var(--text)' }}>
            {format(day, 'MMM d')}
          </div>
        </div>
        {todos.length > 0 && (
          <span className="text-xs text-faint">{done}/{todos.length}</span>
        )}
      </div>

      <ul className="space-y-0.5 min-h-[40px]">
        {todos.map((t) => (
          <TodoItem
            key={t.id}
            todo={t}
            subs={subOf(t.id)}
            onToggle={() => onToggle(t)}
            onDelete={() => onDelete(t.id)}
            onRename={(c) => onRename(t.id, c)}
          />
        ))}
      </ul>

      <div className="flex items-center gap-1.5 text-faint">
        <Plus size={12} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onAdd(input); setInput(''); }
          }}
          placeholder="Add..."
          className="flex-1 bg-transparent text-sm py-1 placeholder:text-faint outline-none text-main"
        />
      </div>
    </div>
  );
}

function TodoItem({ todo, subs, onToggle, onDelete, onRename }: any) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(todo.content);

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', todo.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="group"
    >
      <div className="flex items-start gap-2 py-1 px-1 rounded hover:surface-2">
        <button onClick={onToggle} className={`checkbox mt-0.5 ${todo.done ? 'checked' : ''}`}>
          {todo.done && <Check size={11} strokeWidth={3} />}
        </button>
        {editing ? (
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => { onRename(val); setEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onRename(val); setEditing(false); }
              if (e.key === 'Escape') { setVal(todo.content); setEditing(false); }
            }}
            className="flex-1 bg-transparent text-sm outline-none text-main"
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            className={`text-sm flex-1 break-words cursor-text ${todo.done ? 'line-through text-faint' : 'text-main'}`}
          >
            {todo.content}
          </span>
        )}
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-faint mt-0.5">
          <X size={12} />
        </button>
      </div>
      {subs.length > 0 && (
        <ul className="ml-6 mt-0.5 space-y-0">
          {subs.map((s: any) => (
            <li key={s.id} className="flex items-center gap-2 text-xs px-1 py-0.5">
              <span className="text-faint">↳</span>
              <span className={s.done ? 'line-through text-faint' : 'text-muted'}>{s.content}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
