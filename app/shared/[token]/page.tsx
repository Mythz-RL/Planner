import { createClient } from '@supabase/supabase-js';
import { format, parseISO } from 'date-fns';

// Public read-only view — no auth, anon client.
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
    .eq('user_id', share.user_id)
    .gte('start_date', format(new Date(), 'yyyy-MM-dd'))
    .order('start_date');

  const calIds = (cals ?? []).map((c: any) => c.id);
  const schoolEvents = (events ?? []).filter((e: any) => calIds.includes(e.calendar_id));

  return { cals: cals ?? [], events: schoolEvents };
}

export default async function SharedPage({
  params,
}: {
  params: { token: string };
}) {
  const data = await getSharedData(params.token);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper-warm">
        <div className="card p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">Link not found</h1>
          <p className="text-ink-light text-sm">
            This share link is invalid or has been revoked.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper-warm py-12 px-6">
      <div className="max-w-2xl mx-auto fade-up">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-ink-faint mb-1">
            Read-only · school events
          </div>
          <h1 className="text-3xl font-semibold">Upcoming</h1>
        </div>

        {data.events.length === 0 ? (
          <p className="text-ink-light italic">No upcoming school events.</p>
        ) : (
          <ul className="space-y-2">
            {data.events.map((e: any) => (
              <li key={e.id} className="card p-4 flex items-start gap-3">
                <div className="text-center w-14 shrink-0">
                  <div className="text-xs uppercase text-ink-faint">
                    {format(parseISO(e.start_date), 'MMM')}
                  </div>
                  <div className="text-2xl font-semibold">
                    {format(parseISO(e.start_date), 'd')}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{e.title}</div>
                  {e.start_time && (
                    <div className="text-xs text-ink-faint mt-0.5">
                      {e.start_time.slice(0, 5)}
                    </div>
                  )}
                  {e.description && (
                    <div className="text-sm text-ink-light mt-1">{e.description}</div>
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
