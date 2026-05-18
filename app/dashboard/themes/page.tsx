'use client';

import { useTheme, PRESETS, ThemePreset } from '@/lib/theme';
import { Check, Palette } from 'lucide-react';

const PRESET_INFO: { id: ThemePreset; name: string; description: string }[] = [
  { id: 'light',    name: 'Light',    description: 'Clean and bright, classic look' },
  { id: 'dark',     name: 'Dark',     description: 'Easy on the eyes at night' },
  { id: 'sepia',    name: 'Sepia',    description: 'Warm and paper-like' },
  { id: 'midnight', name: 'Midnight', description: 'Deep blue, focused vibe' },
  { id: 'forest',   name: 'Forest',   description: 'Calm and natural greens' },
];

export default function ThemesPage() {
  const { preset, colors, setPreset, setCustomColors } = useTheme();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-12 fade-up">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Palette size={20} style={{ color: 'var(--accent)' }} />
          <h1 className="text-2xl sm:text-3xl font-semibold text-main">Theme</h1>
        </div>
        <p className="text-muted text-sm">Pick a preset or design your own.</p>
      </header>

      <section className="mb-10">
        <h2 className="text-xs uppercase tracking-wider text-faint mb-3">Presets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESET_INFO.map((p) => {
            const c = PRESETS[p.id as Exclude<ThemePreset, 'custom'>];
            const active = preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className="card p-4 text-left transition-all relative overflow-hidden"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--line)',
                  borderWidth: active ? '2px' : '1px',
                }}
              >
                {active && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center pop"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Check size={11} strokeWidth={3} color="white" />
                  </div>
                )}
                <div className="flex gap-1 mb-3">
                  <div className="w-8 h-8 rounded" style={{ background: c.bg, border: `1px solid ${c.line}` }} />
                  <div className="w-8 h-8 rounded" style={{ background: c.surface }} />
                  <div className="w-8 h-8 rounded" style={{ background: c.accent }} />
                  <div className="w-8 h-8 rounded" style={{ background: c.text }} />
                </div>
                <div className="font-medium text-main">{p.name}</div>
                <div className="text-xs text-faint mt-0.5">{p.description}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-faint mb-3">Custom</h2>
        <div className="card p-4 sm:p-6 space-y-4">
          <p className="text-sm text-muted">
            Adjust any color. Changes save automatically.
          </p>

          <ColorRow label="Background" value={colors.bg} onChange={(v) => setCustomColors({ bg: v })} />
          <ColorRow label="Surface" value={colors.surface} onChange={(v) => setCustomColors({ surface: v, surface2: v })} />
          <ColorRow label="Text" value={colors.text} onChange={(v) => setCustomColors({ text: v })} />
          <ColorRow label="Muted text" value={colors.textMuted} onChange={(v) => setCustomColors({ textMuted: v, textFaint: v })} />
          <ColorRow label="Borders" value={colors.line} onChange={(v) => setCustomColors({ line: v })} />
          <ColorRow label="Accent" value={colors.accent} onChange={(v) => setCustomColors({ accent: v })} />

          <button
            onClick={() => setPreset('light')}
            className="btn text-xs"
            style={{ border: '1px solid var(--line)' }}
          >
            Reset to Light
          </button>
        </div>
      </section>

      <p className="text-xs text-faint mt-6 text-center">
        Theme syncs across all your devices.
      </p>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-main flex-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input text-xs font-mono w-28"
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer"
          style={{ border: '1px solid var(--line)' }}
        />
      </div>
    </div>
  );
}
