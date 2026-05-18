'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Repeat, Trash2 } from 'lucide-react';
import { expandEvents, OccurrenceEvent, RawEvent } from '@/lib/utils';

type Calendar = { id: string; name: string; color: string; is_school: boolean };

const PALETTE = [
  '#2383e2', '#9065b0', '#0f7b6c', '#d44c47', '#cb912f',
  '#e07c44', '#5a8fc1', '#a64d79', '#787774',
];

const RECURRENCE_OPTIONS = [
  { value: 'none',     label: "Doesn't repeat" },
  { value: 'daily',    label: 'Every day' },
  { value: 'weekdays', label: 'Every weekday (Mon-Fri)' },
  { value: 'weekly',   label: 'Every week' },
  { value: 'monthly',  label: 'Every month' },
];

export default function CalendarPage() {
  const supabase = createClient();
  const [cursor, setCursor] = useState(new Date());
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [rawEvents, setRawEvents] = useState<RawEvent[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [openDay, setOpenDay] = useState<Date | null>(null);
  const [newCalName, setNewCalName] = useState('');
  const [showNewCal, setShowNewCal] = useState(false);
  const [showCalList, setShowCalList] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from('calendars').select('*').order('created_at');
      const { data: e } = await supabase.from('events').select('*');
      setCalendars(c ?? []);
      setRawEvents((e ?? []) as RawEvent[]);
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

  const monthEvents = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return expandEvents(rawEvents, start, end).filter((e) => visible[e.calendar_id]);
  }, [rawEvents, visible, cursor]);

  function eventsOn(day: Date): OccurrenceEvent[] {
    const dayStr = format(day, 'yyyy-MM-dd');
    return monthEvents.filter((e) => e.occurrence_date === dayStr);
  }

  const colorOf = (id: string) =>
    calendars.find((c) => c.id === id)?.color ?? 'var(--text-faint)';

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
    setRawEvents(rawEvents.filter((e) => e.calendar_id !== id));
  }

  async function updateCalendarColor(id: string, color: string) {
    setCalendars(calendars.map((c) => (c.id === id ? { ...c, color } : c)));
    await supabase.from('calendars').update({ color }).eq('id', id);
  }

  async function reload() {
    const { data: e } = await supabase.from('events').select('*');
    setRawEvents((e ?? []) as RawEvent[]);
  }

  const CalendarList = (
    <div className="p-3 sm:p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider text-faint">Calendars</h3>
        <button onClick={() => setShowNewCal(true)} className="text-faint hover:text-main">
          <Plus size={14} />
        </button>
      </div>

      <ul className="space-y-1">
        {calendars.map((c) => (
          <li key={c.id} className="group flex items-center gap-2 px-1 py-1">
            <input
              type="checkbox"
              checked={!!visible[c.id]}
              onChange={() => setVisible({ ...visible, [c.id]: !visible[c.id] })}
              className="w-3.5 h-3.5"
              style={{ accentColor: c.color }}
            />
            <CircleColorPicker
              color={c.color}
              onChange={(col) => updateCalendarColor(c.id, col)}
            />
            <span className="text-sm flex-1 truncate text-main">{c.name}</span>
            <button
              onClick={() => deleteCalendar(c.id)}
              className="opacity-0 group-hover:opacity-100 sm:opacity-0 text-faint"
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
            <button onClick={addCalendar} className="btn-accent text-xs flex-1 justify-center">Add</button>
            <button onClick={() => setShowNewCal(false)} className="btn text-xs">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="md:flex md:h-screen">
      {/* Desktop calendar list */}
      <div className="hidden md:block w-56 shrink-0 border-r surface" style={{ borderColor: 'var(--line)' }}>
        {CalendarList}
      </div>

      {/* Main calendar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b" style={{ borderColor: 'var(--line)' }}>
          <h1 className="text-lg sm:text-2xl font-semibold text-main">{format(cursor, 'MMM yyyy')}</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowCalList(!showCalList)} className="btn text-xs md:hidden">
              Calendars
            </button>
            <button onClick={() => setCursor(new Date())} className="btn text-xs">Today</button>
            <button onClick={() => setCursor(subMonths(cursor, 1))} className="btn"><ChevronLeft size={16} /></button>
            <button onClick={() => setCursor(addMonths(cursor, 1))} className="btn"><ChevronRight size={16} /></button>
          </div>
        </header>

        {/* Mobile calendar list drawer */}
        {showCalList && (
          <div className="md:hidden border-b" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            {CalendarList}
          </div>
        )}

        <div className="grid grid-cols-7 border-b surface" style={{ borderColor: 'var(--line)' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="px-1 sm:px-2 py-1.5 text-[10px] sm:text-xs uppercase tracking-wider text-faint text-center sm:text-left">
              <span className="sm:hidden">{d}</span>
              <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
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
                className="border-r border-b p-1 sm:p-1.5 text-left transition-colors hover:surface-2"
                style={{
                  borderColor: 'var(--line)',
                  background: !inMonth ? 'var(--surface)' : 'transparent',
                  opacity: !inMonth ? 0.6 : 1,
                  minHeight: '70px',
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[11px] sm:text-xs mb-1"
                  style={{
                    background: today ? 'var(--accent)' : 'transparent',
                    color: today ? 'white' : (inMonth ? 'var(--text)' : 'var(--text-faint)'),
                    fontWeight: today ? 600 : 400,
                  }}
                >
                  {format(d, 'd')}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id + e.occurrence_date}
                      className="text-[10px] sm:text-[11px] px-1 py-0.5 rounded truncate flex items-center gap-1"
                      style={{
                        background: colorOf(e.calendar_id) + '22',
                        color: colorOf(e.calendar_id),
                      }}
                    >
                      {e.recurrence && e.recurrence !== 'none' && (
                        <Repeat size={8} className="shrink-0" />
                      )}
                      <span className="truncate">{e.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] sm:text-[11px] text-faint px-1">
                      +{dayEvents.length - 2}
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
          rawEvents={rawEvents}
          occurrences={eventsOn(openDay)}
          onClose={() => setOpenDay(null)}
          onChange={reload}
        />
      )}
    </div>
  );
}

function CircleColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="w-2.5 h-2.5 rounded-full"
        style={{ background: color }}
        onClick={() => setOpen(!open)}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-5 left-0 z-50 grid grid-cols-3 gap-1 p-2 rounded-md card pop"
          >
            {PALETTE.map((c) => (
              <button
                key={c}
                className="w-5 h-5 rounded-full hover:scale-110 transition-transform"
                style={{ background: c }}
                onClick={() => { onChange(c); setOpen(false); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DayModal({
  day, calendars, rawEvents, occurrences, onClose, onChange,
}: {
  day: Date;
  calendars: Calendar[];
  rawEvents: RawEvent[];
  occurrences: OccurrenceEvent[];
  onClose: () => void;
  onChange: () => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [calId, setCalId] = useState(calendars[0]?.id ?? '');
  const [recurrence, setRecurrence] = useState('none');

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
      recurrence: recurrence === 'none' ? null : recurrence,
    });
    setTitle('');
    setTime('');
    setRecurrence('none');
    onChange();
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event (and all recurring instances)?')) return;
    await supabase.from('events').delete().eq('id', id);
    onChange();
  }

  const colorOf = (id: string) =>
    calendars.find((c) => c.id === id)?.color ?? 'var(--text-faint)';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fade-in" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md p-5 sm:p-6 fade-up safe-bottom"
        style={{
          background: 'var(--bg)',
          borderRadius: '14px 14px 0 0',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div className="hidden sm:block" style={{ borderRadius: 12 }} />
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold text-main">{format(day, 'EEE, MMM d')}</h2>
          <button onClick={onClose} className="btn"><X size={18} /></button>
        </div>

        <ul className="space-y-1 mb-4 max-h-60 overflow-auto">
          {occurrences.map((e) => (
            <li
              key={e.id + e.occurrence_date}
              className="group flex items-center gap-2 px-2.5 py-2 rounded-md hover:surface-2"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorOf(e.calendar_id) }} />
              <span className="text-sm flex-1 text-main truncate">{e.title}</span>
              {e.recurrence && e.recurrence !== 'none' && (
                <Repeat size={11} className="text-faint" />
              )}
              {e.start_time && (
                <span className="text-xs text-faint">{e.start_time.slice(0, 5)}</span>
              )}
              <button onClick={() => deleteEvent(e.id)} className="opacity-0 group-hover:opacity-100">
                <Trash2 size={12} className="text-faint" />
              </button>
            </li>
          ))}
          {occurrences.length === 0 && (
            <li className="text-sm text-faint italic px-2">No events.</li>
          )}
        </ul>

        <div className="border-t pt-4 space-y-2" style={{ borderColor: 'var(--line)' }}>
          <input
            className="input"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEvent()}
          />
          <div className="flex gap-2">
            <select className="input flex-1" value={calId} onChange={(e) => setCalId(e.target.value)}>
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="time"
              className="input w-28"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <select className="input" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
            {RECURRENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button onClick={addEvent} className="btn-accent w-full justify-center py-2.5">
            Add event
          </button>
        </div>
      </div>
    </div>
  );
}
