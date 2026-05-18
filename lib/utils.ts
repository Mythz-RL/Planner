import { addDays, addWeeks, addMonths, parseISO, format, isBefore, isAfter, isSameDay, differenceInDays } from 'date-fns';

export type RawEvent = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  all_day: boolean;
  calendar_id: string;
  recurrence: string | null;
  recurrence_until: string | null;
};

export type OccurrenceEvent = RawEvent & {
  occurrence_date: string; // the specific date this instance falls on
  is_recurring_instance: boolean;
};

/**
 * Expand a recurring event into individual occurrences within [from, to].
 */
export function expandEvent(e: RawEvent, from: Date, to: Date): OccurrenceEvent[] {
  const baseStart = parseISO(e.start_date);
  if (!e.recurrence || e.recurrence === 'none') {
    if (baseStart >= from && baseStart <= to) {
      return [{ ...e, occurrence_date: e.start_date, is_recurring_instance: false }];
    }
    return [];
  }

  const cap = e.recurrence_until ? parseISO(e.recurrence_until) : to;
  const limit = isBefore(cap, to) ? cap : to;
  const results: OccurrenceEvent[] = [];

  let cursor = baseStart;
  let safety = 0;
  while (cursor <= limit && safety < 1000) {
    if (cursor >= from) {
      const valid =
        e.recurrence === 'weekdays'
          ? cursor.getDay() >= 1 && cursor.getDay() <= 5
          : true;
      if (valid) {
        results.push({
          ...e,
          occurrence_date: format(cursor, 'yyyy-MM-dd'),
          is_recurring_instance: !isSameDay(cursor, baseStart),
        });
      }
    }
    switch (e.recurrence) {
      case 'daily':    cursor = addDays(cursor, 1); break;
      case 'weekdays': cursor = addDays(cursor, 1); break;
      case 'weekly':   cursor = addWeeks(cursor, 1); break;
      case 'monthly':  cursor = addMonths(cursor, 1); break;
      default: return results;
    }
    safety++;
  }
  return results;
}

export function expandEvents(events: RawEvent[], from: Date, to: Date): OccurrenceEvent[] {
  return events.flatMap((e) => expandEvent(e, from, to));
}

/**
 * Compute streak from sorted check-in dates (oldest first).
 * Returns { current, longest }.
 */
export function computeStreak(checkinDates: string[]): { current: number; longest: number } {
  if (checkinDates.length === 0) return { current: 0, longest: 0 };
  const sorted = [...checkinDates].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISO(sorted[i - 1]);
    const curr = parseISO(sorted[i]);
    if (differenceInDays(curr, prev) === 1) {
      run++;
      longest = Math.max(longest, run);
    } else if (differenceInDays(curr, prev) > 1) {
      run = 1;
    }
  }
  // Current streak: count back from today
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(addDays(today, -1), 'yyyy-MM-dd');
  const set = new Set(checkinDates);
  if (!set.has(todayStr) && !set.has(yesterdayStr)) {
    return { current: 0, longest };
  }
  let current = 0;
  let cursor = set.has(todayStr) ? today : addDays(today, -1);
  while (set.has(format(cursor, 'yyyy-MM-dd'))) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}
