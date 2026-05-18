'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Calendar, CheckSquare, Target, LogOut, Share2,
  Flame, Palette, Menu, X, LayoutDashboard,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const links = [
  { href: '/dashboard',          label: 'Today',     icon: LayoutDashboard, exact: true },
  { href: '/dashboard/calendar', label: 'Calendar',  icon: Calendar },
  { href: '/dashboard/todos',    label: 'To-dos',    icon: CheckSquare },
  { href: '/dashboard/habits',   label: 'Habits',    icon: Flame },
  { href: '/dashboard/goals',    label: 'Goals',     icon: Target },
];

const bottomLinks = [
  { href: '/dashboard/themes', label: 'Theme',  icon: Palette },
  { href: '/dashboard/share',  label: 'Share',  icon: Share2 },
];

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  const navContent = (
    <>
      <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="text-sm font-medium truncate text-main">{email}</div>
        <div className="text-xs text-faint">Planner</div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-2.5 py-2 md:py-1.5 rounded-md text-sm transition-all"
              style={{
                background: active ? 'var(--surface-2)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t space-y-0.5 safe-bottom" style={{ borderColor: 'var(--line)' }}>
        {bottomLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-2.5 py-2 md:py-1.5 rounded-md text-sm transition-all"
              style={{
                background: active ? 'var(--surface-2)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              <Icon size={16} /> {label}
            </Link>
          );
        })}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-2.5 py-2 md:py-1.5 rounded-md text-sm transition-all text-muted hover:text-main"
          style={{ background: 'transparent' }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header
        className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-12 border-b safe-top"
        style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
      >
        <button onClick={() => setOpen(true)} className="btn -ml-1" aria-label="Menu">
          <Menu size={20} />
        </button>
        <div className="text-sm font-medium text-main">Planner</div>
        <div className="w-9" />
      </header>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-60 shrink-0 flex-col border-r"
        style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 fade-in"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setOpen(false)}
          />
          <aside
            className="relative w-72 max-w-[80vw] flex flex-col slide-in-left safe-top"
            style={{ background: 'var(--surface)' }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 btn"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
