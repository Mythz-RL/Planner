'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

type Calendar = { id: string; name: string; color: string; is_school: boolean };
type Event = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  all_day: boolean;
  calendar_id: string;
};

const PALETTE = ['#2383e2', '#9065b0', '#0f7b6c', '#d44c47', '#cb912f', '#787774'];

export default function CalendarPage() {
  const supabase = createClient();
  const [cursor, setCursor] = useState(new Date());
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [openDay, setOpenDay] = useState<Date | null>(null);
  const [newCalName, setNewCalName] = useState('');
  const [showNewCal, setShowNewCal] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from('calendars').select('*').order('created_at');
      const { data: e } = await supabase.from('events').select('*');
      setCalendars(c ?? []);
      setEvents(e ?? []);
      const v: Record<string, boolean> = {};
      (c ?? []).forEach((x: Calendar) => (v[x.id] = true));
      setVisible(v);
    })();
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const arr: Date[] = [];
    let d = start;
    while (d <= end) {
      arr.push(d);
      d = addDays(d, 1);
    }
    return arr;
  }, [cursor]);

  function eventsOn(day: Date) {
    return events.filter((e) => {
      if (!visible[e.calendar_id]) return false;
      const s = parseISO(e.start_date);
      const en = e.end_date ? parseISO(e.end_date) : s;
      return day >= new Date(s.setHours(0)) && day <= new Date(en.setHours(23, 59));
    });
  }

  const colorOf = (id: string) =>
    calendars.find((c) => c.id === id)?.color ?? '#9b9a97';

  async function addCalendar() {
    if (!newCalName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const color = PALETTE[calendars.length % PALETTE.length];
    const { data } = await supabase
      .from('calendars')
      .insert({ user_id: user.id, name: newCalName.trim(), color, is_school: false })
      .select()
      .single();
    if (data) {
      setCalendars([...calendars, data]);
      setVisible({ ...visible, [data.id]: true });
    }
    setNewCalName('');
    setShowNewCal(false);
  }

  async function deleteCalendar(id: string) {
    if (!confirm('Delete this calendar and all its events?')) return;
    await supabase.from('calendars').delete().eq('id', id);
    setCalendars(calendars.filter((c) => c.id !== id));
    setEvents(events.filter((e) => e.calendar_id !== id));
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar: calendar list */}
      <div className="w-56 shrink-0 border-r border-paper-line bg-paper-warm p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wider text-ink-faint">
            Calendars
          </h3>
          <button
            onClick={() => setShowNewCal(true)}
            className="text-ink-faint hover:text-ink"
          >
            <Plus size={14} />
          </button>
        </div>

        <ul className="space-y-1">
          {calendars.map((c) => (
            <li key={c.id} className="group flex items-center gap-2 px-1 py-0.5">
              <input
                type="checkbox"
                checked={!!visible[c.id]}
                onChange={() => setVisible({ ...visible, [c.id]: !visible[c.id] })}
                className="accent-ink w-3.5 h-3.5"
              />
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: c.color }}
              />
              <span className="text-sm flex-1 truncate">{c.name}</span>
              <button
                onClick={() => deleteCalendar(c.id)}
                className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-accent-personal"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>

        {showNewCal && (
          <div className="mt-3 space-y-2">
            <input
              autoFocus
              placeholder="Calendar name"
              value={newCalName}
              onChange={(e) => setNewCalName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCalendar()}
              className="input text-xs"
            />
            <div className="flex gap-1">
              <button onClick={addCalendar} className="btn-primary text-xs flex-1 justify-center">
                Add
              </button>
              <button onClick={() => setShowNewCal(false)} className="btn text-xs">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-paper-line">
          <h1 className="text-2xl font-semibold">{format(cursor, 'MMMM yyyy')}</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setCursor(new Date())} className="btn text-xs mr-2">
              Today
            </button>
            <button onClick={() => setCursor(subMonths(cursor, 1))} className="btn">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="btn">
              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-7 border-b border-paper-line bg-paper-warm">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="px-2 py-1.5 text-xs uppercase tracking-wider text-ink-faint"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-auto">
          {days.map((d, i) => {
            const dayEvents = eventsOn(d);
            const inMonth = isSameMonth(d, cursor);
            const today = isSameDay(d, new Date());
            return (
              <button
                key={i}
                onClick={() => setOpenDay(d)}
                className={`border-r border-b border-paper-line p-1.5 text-left hover:bg-paper-muted transition-colors ${
                  !inMonth ? 'bg-paper-warm/50' : ''
                }`}
              >
                <div
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs mb-1 ${
                    today
                      ? 'bg-ink text-white font-medium'
                      : inMonth
                      ? 'text-ink'
                      : 'text-ink-faint'
                  }`}
                >
                  {format(d, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="text-[11px] px-1 py-0.5 rounded truncate"
                      style={{
                        background: `${colorOf(e.calendar_id)}22`,
                        color: colorOf(e.calendar_id),
                      }}
                    >
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[11px] text-ink-faint px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {openDay && (
        <DayModal
          day={openDay}
          calendars={calendars}
          events={events.filter((e) => e.start_date === format(openDay, 'yyyy-MM-dd'))}
          onClose={() => setOpenDay(null)}
          onChange={async () => {
            const { data: e } = await supabase.from('events').select('*');
            setEvents(e ?? []);
          }}
        />
      )}
    </div>
  );
}

function DayModal({
  day,
  calendars,
  events,
  onClose,
  onChange,
}: {
  day: Date;
  calendars: Calendar[];
  events: Event[];
  onClose: () => void;
  onChange: () => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [calId, setCalId] = useState(calendars[0]?.id ?? '');

  async function addEvent() {
    if (!title.trim() || !calId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('events').insert({
      user_id: user.id,
      calendar_id: calId,
      title: title.trim(),
      start_date: format(day, 'yyyy-MM-dd'),
      start_time: time || null,
      all_day: !time,
    });
    setTitle('');
    setTime('');
    onChange();
  }

  async function deleteEvent(id: string) {
    await supabase.from('events').delete().eq('id', id);
    onChange();
  }

  const colorOf = (id: string) =>
    calendars.find((c) => c.id === id)?.color ?? '#9b9a97';

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-lift w-full max-w-md p-6 fade-up"
      >
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold">{format(day, 'EEEE, MMM d')}</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <ul className="space-y-1 mb-4 max-h-60 overflow-auto">
          {events.map((e) => (
            <li
              key={e.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-paper-muted"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: colorOf(e.calendar_id) }}
              />
              <span className="text-sm flex-1">{e.title}</span>
              {e.start_time && (
                <span className="text-xs text-ink-faint">{e.start_time.slice(0, 5)}</span>
              )}
              <button
                onClick={() => deleteEvent(e.id)}
                className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-accent-personal"
              >
                <X size={12} />
              </button>
            </li>
          ))}
          {events.length === 0 && (
            <li className="text-sm text-ink-faint italic px-2">No events.</li>
          )}
        </ul>

        <div className="border-t border-paper-line pt-4 space-y-2">
          <input
            className="input"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEvent()}
          />
          <div className="flex gap-2">
            <select
              className="input flex-1"
              value={calId}
              onChange={(e) => setCalId(e.target.value)}
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="time"
              className="input w-28"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <button onClick={addEvent} className="btn-primary w-full justify-center">
            Add event
          </button>
        </div>
      </div>
    </div>
  );
}
