'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO, addDays } from 'date-fns';
import { Plus, Check, X, ChevronRight, ChevronDown, Flame, Clock, GripVertical } from 'lucide-react';
import { expandEvents, OccurrenceEvent, RawEvent, computeStreak } from '@/lib/utils';

type Calendar = { id: string; name: string; color: string };
type Todo = {
  id: string;
  content: string;
  done: boolean;
  position: number;
  parent_id: string | null;
};
type Habit = { id: string; name: string; icon: string; color: string };

export default function TodayPage() {
  const supabase = createClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDisplay = format(new Date(), 'EEEE, MMMM d');
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5)  return 'Up late?';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  })();

  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<OccurrenceEvent[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitDone, setHabitDone] = useState<Set<string>>(new Set());
  const [habitStreaks, setHabitStreaks] = useState<Record<string, number>>({});
  const [newTodo, setNewTodo] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const todayDate = new Date();
      const [c, e, t, h, ch] = await Promise.all([
        supabase.from('calendars').select('*'),
        supabase.from('events').select('*'),
        supabase.from('todos').select('*').eq('day', today).order('position'),
        supabase.from('habits').select('*').eq('archived', false).order('position'),
        supabase.from('habit_checkins').select('*'),
      ]);
      setCalendars(c.data ?? []);
      setEvents(expandEvents((e.data ?? []) as RawEvent[], todayDate, todayDate));
      setTodos(t.data ?? []);
      setHabits(h.data ?? []);
      const todaysCheckins = new Set<string>(
        (ch.data ?? []).filter((x: any) => x.day === today).map((x: any) => x.habit_id)
      );
      setHabitDone(todaysCheckins);
      // Streaks
      const streaks: Record<string, number> = {};
      (h.data ?? []).forEach((habit: any) => {
        const days = (ch.data ?? [])
          .filter((x: any) => x.habit_id === habit.id)
          .map((x: any) => x.day);
        streaks[habit.id] = computeStreak(days).current;
      });
      setHabitStreaks(streaks);
      setLoading(false);
    })();
  }, []);

  async function addTodo(parentId: string | null = null) {
    const content = parentId ? '' : newTodo.trim();
    if (!parentId && !content) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const siblings = todos.filter((x) => x.parent_id === parentId);
    const text = parentId ? 'New subtask' : content;
    const { data } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        day: today,
        content: text,
        position: siblings.length,
        parent_id: parentId,
      })
      .select()
      .single();
    if (data) setTodos([...todos, data]);
    if (!parentId) setNewTodo('');
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

  async function toggleHabit(h: Habit) {
    const done = habitDone.has(h.id);
    const next = new Set(habitDone);
    if (done) {
      next.delete(h.id);
      setHabitDone(next);
      await supabase.from('habit_checkins').delete().eq('habit_id', h.id).eq('day', today);
      setHabitStreaks({ ...habitStreaks, [h.id]: Math.max(0, (habitStreaks[h.id] ?? 0) - 1) });
    } else {
      next.add(h.id);
      setHabitDone(next);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('habit_checkins').insert({ user_id: user.id, habit_id: h.id, day: today });
      }
      setHabitStreaks({ ...habitStreaks, [h.id]: (habitStreaks[h.id] ?? 0) + 1 });
    }
  }

  const colorOf = (id: string) => calendars.find((c) => c.id === id)?.color ?? 'var(--text-faint)';
  const topTodos = todos.filter((t) => !t.parent_id).sort((a, b) => a.position - b.position);
  const subOf = (id: string) =>
    todos.filter((t) => t.parent_id === id).sort((a, b) => a.position - b.position);

  const doneCount = todos.filter((t) => t.done && !t.parent_id).length;
  const totalCount = topTodos.length;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-12 w-72 mb-10" />
        <div className="space-y-2">
          <div className="skeleton h-8 w-full" />
          <div className="skeleton h-8 w-5/6" />
          <div className="skeleton h-8 w-4/6" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-12 fade-up">
      {/* Greeting */}
      <div className="mb-8">
        <div className="text-sm text-faint mb-1">{todayDisplay}</div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-main">
          {greeting}
        </h1>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
        <div className="card p-3 sm:p-4">
          <div className="text-xs text-faint uppercase tracking-wider mb-1">Events</div>
          <div className="text-xl sm:text-2xl font-semibold text-main">{events.length}</div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs text-faint uppercase tracking-wider mb-1">To-do</div>
          <div className="text-xl sm:text-2xl font-semibold text-main">
            {doneCount}<span className="text-sm text-faint">/{totalCount}</span>
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs text-faint uppercase tracking-wider mb-1">Habits</div>
          <div className="text-xl sm:text-2xl font-semibold text-main">
            {habitDone.size}<span className="text-sm text-faint">/{habits.length}</span>
          </div>
        </div>
      </div>

      {/* Habits row */}
      {habits.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-wider text-faint mb-3">
            Today's habits
          </h2>
          <div className="flex flex-wrap gap-2">
            {habits.map((h) => {
              const done = habitDone.has(h.id);
              const streak = habitStreaks[h.id] ?? 0;
              return (
                <button
                  key={h.id}
                  onClick={() => toggleHabit(h)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all active:scale-95"
                  style={{
                    background: done ? h.color + '22' : 'var(--bg)',
                    borderColor: done ? h.color : 'var(--line)',
                    color: done ? h.color : 'var(--text)',
                  }}
                >
                  <span className="text-lg leading-none">{h.icon}</span>
                  <span className="text-sm font-medium">{h.name}</span>
                  {streak > 0 && (
                    <span className="flex items-center gap-0.5 text-xs">
                      <Flame size={12} /> {streak}
                    </span>
                  )}
                  {done && <Check size={14} className="check-pop" />}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Events */}
      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-wider text-faint mb-3">
          Today's events
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-faint italic">Nothing scheduled.</p>
        ) : (
          <ul className="space-y-1">
            {events
              .sort((a, b) => (a.start_time ?? 'zz').localeCompare(b.start_time ?? 'zz'))
              .map((e) => (
                <li
                  key={e.id + e.occurrence_date}
                  className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:surface-2"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorOf(e.calendar_id) }} />
                  <span className="text-sm text-main flex-1 truncate">{e.title}</span>
                  {e.start_time && (
                    <span className="text-xs text-faint flex items-center gap-1 shrink-0">
                      <Clock size={11} /> {e.start_time.slice(0, 5)}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* Todos with subtasks + drag */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-faint">To-do</h2>
          {totalCount > 0 && (
            <span className="text-xs text-faint">{doneCount} / {totalCount}</span>
          )}
        </div>

        <DraggableTodos
          todos={topTodos}
          subOf={subOf}
          onReorder={async (orderedIds) => {
            const updated = todos.map((t) => {
              if (t.parent_id) return t;
              const pos = orderedIds.indexOf(t.id);
              return pos >= 0 ? { ...t, position: pos } : t;
            });
            setTodos(updated);
            await Promise.all(
              orderedIds.map((id, pos) =>
                supabase.from('todos').update({ position: pos }).eq('id', id)
              )
            );
          }}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onRename={renameTodo}
          onAddSub={(id) => addTodo(id)}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <div className="flex items-center gap-2 px-3 mt-2">
          <Plus size={14} className="text-faint" />
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a to-do..."
            className="flex-1 bg-transparent text-sm py-1.5 placeholder:text-faint outline-none text-main"
          />
        </div>
      </section>
    </div>
  );
}

// ============== Draggable todo list ==============

function DraggableTodos({
  todos,
  subOf,
  onReorder,
  onToggle,
  onDelete,
  onRename,
  onAddSub,
  collapsed,
  setCollapsed,
}: {
  todos: Todo[];
  subOf: (id: string) => Todo[];
  onReorder: (ids: string[]) => void;
  onToggle: (t: Todo) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, content: string) => void;
  onAddSub: (id: string) => void;
  collapsed: Set<string>;
  setCollapsed: (s: Set<string>) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overSide, setOverSide] = useState<'top' | 'bottom'>('bottom');

  function onDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const side = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom';
    setOverId(id);
    setOverSide(side);
  }
  function onDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    const ids = todos.map((t) => t.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    ids.splice(fromIdx, 1);
    const insertAt = overSide === 'top' ? toIdx : toIdx + (fromIdx < toIdx ? 0 : 1);
    ids.splice(insertAt, 0, dragId);
    onReorder(ids);
    setDragId(null);
    setOverId(null);
  }

  return (
    <ul className="space-y-0">
      {todos.map((t) => (
        <TodoRow
          key={t.id}
          todo={t}
          subs={subOf(t.id)}
          collapsed={collapsed.has(t.id)}
          dragging={dragId === t.id}
          overTop={overId === t.id && overSide === 'top'}
          overBottom={overId === t.id && overSide === 'bottom'}
          onDragStart={(e) => onDragStart(e, t.id)}
          onDragOver={(e) => onDragOver(e, t.id)}
          onDrop={(e) => onDrop(e, t.id)}
          onDragEnd={() => { setDragId(null); setOverId(null); }}
          onToggle={() => onToggle(t)}
          onDelete={() => onDelete(t.id)}
          onRename={(c) => onRename(t.id, c)}
          onAddSub={() => onAddSub(t.id)}
          onToggleSub={(sub) => onToggle(sub)}
          onDeleteSub={(id) => onDelete(id)}
          onRenameSub={(id, c) => onRename(id, c)}
          toggleCollapsed={() => {
            const next = new Set(collapsed);
            if (next.has(t.id)) next.delete(t.id);
            else next.add(t.id);
            setCollapsed(next);
          }}
        />
      ))}
    </ul>
  );
}

function TodoRow({
  todo, subs, collapsed, dragging, overTop, overBottom,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onToggle, onDelete, onRename, onAddSub,
  onToggleSub, onDeleteSub, onRenameSub, toggleCollapsed,
}: any) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(todo.content);

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group ${dragging ? 'dragging' : ''} ${overTop ? 'drag-over-top' : ''} ${overBottom ? 'drag-over-bottom' : ''}`}
    >
      <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md hover:surface-2 transition-colors">
        <GripVertical
          size={14}
          className="text-faint opacity-0 group-hover:opacity-100 cursor-grab hidden sm:block"
        />
        {subs.length > 0 ? (
          <button onClick={toggleCollapsed} className="text-faint hover:text-main shrink-0">
            {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : (
          <span className="w-3.5 hidden sm:inline-block" />
        )}
        <button onClick={onToggle} className={`checkbox ${todo.done ? 'checked' : ''}`} aria-label="Toggle">
          {todo.done && <Check size={11} strokeWidth={3} className="check-pop" />}
        </button>
        {editing ? (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => { onRename(value); setEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onRename(value); setEditing(false); }
              if (e.key === 'Escape') { setValue(todo.content); setEditing(false); }
            }}
            className="flex-1 bg-transparent text-sm outline-none text-main"
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            className={`text-sm flex-1 cursor-text ${todo.done ? 'line-through text-faint' : 'text-main'}`}
          >
            {todo.content}
          </span>
        )}
        <button
          onClick={onAddSub}
          className="text-faint hover:text-main opacity-0 group-hover:opacity-100 shrink-0"
          title="Add subtask"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={onDelete}
          className="text-faint opacity-0 group-hover:opacity-100 shrink-0"
          style={{ color: 'var(--text-faint)' }}
        >
          <X size={14} />
        </button>
      </div>

      {!collapsed && subs.length > 0 && (
        <ul className="ml-7 sm:ml-10">
          {subs.map((s: Todo) => (
            <SubRow
              key={s.id}
              todo={s}
              onToggle={() => onToggleSub(s)}
              onDelete={() => onDeleteSub(s.id)}
              onRename={(c: string) => onRenameSub(s.id, c)}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function SubRow({ todo, onToggle, onDelete, onRename }: any) {
  const [editing, setEditing] = useState(todo.content === 'New subtask');
  const [value, setValue] = useState(todo.content === 'New subtask' ? '' : todo.content);

  return (
    <li className="group flex items-center gap-2 px-2 sm:px-3 py-1 rounded-md hover:surface-2 transition-colors">
      <button onClick={onToggle} className={`checkbox ${todo.done ? 'checked' : ''}`} aria-label="Toggle">
        {todo.done && <Check size={10} strokeWidth={3} />}
      </button>
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (!value.trim()) onDelete();
            else onRename(value);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { if (!value.trim()) onDelete(); else onRename(value); setEditing(false); }
            if (e.key === 'Escape') { setValue(todo.content); setEditing(false); }
          }}
          placeholder="Subtask..."
          className="flex-1 bg-transparent text-sm outline-none text-main"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`text-sm flex-1 cursor-text ${todo.done ? 'line-through text-faint' : 'text-main'}`}
        >
          {todo.content}
        </span>
      )}
      <button onClick={onDelete} className="text-faint opacity-0 group-hover:opacity-100">
        <X size={12} />
      </button>
    </li>
  );
}
