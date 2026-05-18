import { createClient } from '@supabase/supabase-js';
import { format, parseISO, addMonths } from 'date-fns';
import { expandEvents, RawEvent } from '@/lib/utils';

async function getSharedData(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: share } = await supabase
    .from('share_links')
    .select('user_id')
    .eq('token', token)
    .maybeSingle();

  if (!share) return null;

  const { data: cals } = await supabase
    .from('calendars')
    .select('*')
    .eq('user_id', share.user_id)
    .eq('is_school', true);

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', share.user_id);

  const calIds = (cals ?? []).map((c: any) => c.id);
  const schoolEvents = ((events ?? []) as RawEvent[]).filter((e) => calIds.includes(e.calendar_id));

  // Expand into next 60 days
  const today = new Date();
  const horizon = addMonths(today, 2);
  const occurrences = expandEvents(schoolEvents, today, horizon);

  return { cals: cals ?? [], events: occurrences };
}

export default async function SharedPage({ params }: { params: { token: string } }) {
  const data = await getSharedData(params.token);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#fbfaf9' }}>
        <div className="card p-8 text-center" style={{ background: 'white', border: '1px solid #ebeae6', borderRadius: 8 }}>
          <h1 className="text-xl font-semibold mb-2">Link not found</h1>
          <p className="text-sm" style={{ color: '#787774' }}>
            This share link is invalid or has been revoked.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 sm:py-12 px-4 sm:px-6" style={{ background: '#fbfaf9' }}>
      <div className="max-w-2xl mx-auto fade-up">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#9b9a97' }}>
            Read-only · school events
          </div>
          <h1 className="text-3xl font-semibold" style={{ color: '#37352f' }}>Upcoming</h1>
        </div>

        {data.events.length === 0 ? (
          <p className="italic" style={{ color: '#787774' }}>No upcoming school events.</p>
        ) : (
          <ul className="space-y-2">
            {data.events.map((e: any) => (
              <li
                key={e.id + e.occurrence_date}
                className="p-4 flex items-start gap-3"
                style={{ background: 'white', border: '1px solid #ebeae6', borderRadius: 8 }}
              >
                <div className="text-center w-14 shrink-0">
                  <div className="text-xs uppercase" style={{ color: '#9b9a97' }}>
                    {format(parseISO(e.occurrence_date), 'MMM')}
                  </div>
                  <div className="text-2xl font-semibold" style={{ color: '#37352f' }}>
                    {format(parseISO(e.occurrence_date), 'd')}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium" style={{ color: '#37352f' }}>{e.title}</div>
                  {e.start_time && (
                    <div className="text-xs mt-0.5" style={{ color: '#9b9a97' }}>
                      {e.start_time.slice(0, 5)}
                    </div>
                  )}
                  {e.description && (
                    <div className="text-sm mt-1" style={{ color: '#787774' }}>{e.description}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
