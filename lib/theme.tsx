'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type ThemePreset = 'light' | 'dark' | 'sepia' | 'midnight' | 'forest' | 'custom';

export type ThemeColors = {
  bg: string;        // page background
  surface: string;   // card / elevated background
  surface2: string;  // hover / muted surface
  line: string;      // borders
  text: string;      // primary text
  textMuted: string; // secondary text
  textFaint: string; // tertiary text
  accent: string;    // primary accent
};

export const PRESETS: Record<Exclude<ThemePreset, 'custom'>, ThemeColors> = {
  light: {
    bg: '#ffffff', surface: '#fbfaf9', surface2: '#f1f1ef', line: '#ebeae6',
    text: '#37352f', textMuted: '#787774', textFaint: '#9b9a97', accent: '#2383e2',
  },
  dark: {
    bg: '#191919', surface: '#202020', surface2: '#2a2a2a', line: '#303030',
    text: '#e8e6e3', textMuted: '#9b9a97', textFaint: '#6f6e6b', accent: '#529cca',
  },
  sepia: {
    bg: '#f4ecd8', surface: '#efe5c8', surface2: '#e7d9b3', line: '#d4c4a0',
    text: '#3d2f1f', textMuted: '#6b5840', textFaint: '#998466', accent: '#a0522d',
  },
  midnight: {
    bg: '#0f1729', surface: '#1a2440', surface2: '#243054', line: '#2d3a64',
    text: '#e0e7ff', textMuted: '#9ca8d1', textFaint: '#6b7a9f', accent: '#7c9bff',
  },
  forest: {
    bg: '#1a2420', surface: '#243029', surface2: '#2d3b33', line: '#3a4a40',
    text: '#e5ebe5', textMuted: '#a8b5a8', textFaint: '#788478', accent: '#7cb88f',
  },
};

type ThemeCtx = {
  preset: ThemePreset;
  colors: ThemeColors;
  setPreset: (p: ThemePreset) => Promise<void>;
  setCustomColors: (c: Partial<ThemeColors>) => Promise<void>;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function applyColors(c: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty('--bg', c.bg);
  root.style.setProperty('--surface', c.surface);
  root.style.setProperty('--surface-2', c.surface2);
  root.style.setProperty('--line', c.line);
  root.style.setProperty('--text', c.text);
  root.style.setProperty('--text-muted', c.textMuted);
  root.style.setProperty('--text-faint', c.textFaint);
  root.style.setProperty('--accent', c.accent);
  // Compute a translucent accent for backgrounds
  root.style.setProperty('--accent-soft', c.accent + '20');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<ThemePreset>('light');
  const [colors, setColors] = useState<ThemeColors>(PRESETS.light);

  // Load from DB on mount
  useEffect(() => {
    (async () => {
      // Apply cached colors immediately to avoid flash
      const cached = localStorage.getItem('theme-colors');
      const cachedPreset = localStorage.getItem('theme-preset') as ThemePreset | null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setColors(parsed);
          applyColors(parsed);
        } catch {}
      }
      if (cachedPreset) setPresetState(cachedPreset);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        const p = (data.theme || 'light') as ThemePreset;
        let c: ThemeColors;
        if (p === 'custom' && data.custom_bg) {
          c = {
            bg: data.custom_bg,
            surface: data.custom_surface || data.custom_bg,
            surface2: data.custom_surface || data.custom_bg,
            line: data.custom_muted || '#e0e0e0',
            text: data.custom_text || '#000000',
            textMuted: data.custom_muted || '#666666',
            textFaint: data.custom_muted || '#999999',
            accent: data.custom_accent || '#2383e2',
          };
        } else {
          c = PRESETS[p as Exclude<ThemePreset, 'custom'>] || PRESETS.light;
        }
        setPresetState(p);
        setColors(c);
        applyColors(c);
        localStorage.setItem('theme-preset', p);
        localStorage.setItem('theme-colors', JSON.stringify(c));
      }
    })();
  }, []);

  const setPreset = useCallback(async (p: ThemePreset) => {
    setPresetState(p);
    if (p !== 'custom') {
      const c = PRESETS[p];
      setColors(c);
      applyColors(c);
      localStorage.setItem('theme-preset', p);
      localStorage.setItem('theme-colors', JSON.stringify(c));
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_settings').upsert({ user_id: user.id, theme: p, updated_at: new Date().toISOString() });
    }
  }, []);

  const setCustomColors = useCallback(async (partial: Partial<ThemeColors>) => {
    const next = { ...colors, ...partial };
    setColors(next);
    setPresetState('custom');
    applyColors(next);
    localStorage.setItem('theme-preset', 'custom');
    localStorage.setItem('theme-colors', JSON.stringify(next));
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        theme: 'custom',
        custom_bg: next.bg,
        custom_surface: next.surface,
        custom_text: next.text,
        custom_accent: next.accent,
        custom_muted: next.textMuted,
        updated_at: new Date().toISOString(),
      });
    }
  }, [colors]);

  return (
    <Ctx.Provider value={{ preset, colors, setPreset, setCustomColors }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTheme outside provider');
  return c;
}
