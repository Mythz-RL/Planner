'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, CheckSquare, Target, LogOut, Share2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  const links = [
    { href: '/dashboard',          label: 'Today',     icon: CheckSquare, exact: true },
    { href: '/dashboard/calendar', label: 'Calendar',  icon: Calendar },
    { href: '/dashboard/todos',    label: 'To-dos',    icon: CheckSquare },
    { href: '/dashboard/goals',    label: 'Goals',     icon: Target },
  ];

  return (
    <aside className="w-60 shrink-0 bg-paper-warm border-r border-paper-line flex flex-col">
      <div className="px-4 py-4 border-b border-paper-line">
        <div className="text-sm font-medium truncate">{email}</div>
        <div className="text-xs text-ink-faint">Planner</div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors ${
                active ? 'bg-paper-line text-ink' : 'text-ink-light hover:bg-paper-line/60'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-paper-line space-y-0.5">
        <Link
          href="/dashboard/share"
          className="flex items-center gap-2 px-2 py-1 rounded text-sm text-ink-light hover:bg-paper-line/60"
        >
          <Share2 size={16} /> Share with parents
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-2 py-1 rounded text-sm text-ink-light hover:bg-paper-line/60"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
