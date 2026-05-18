import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'Planner',
  description: 'Your all-in-one planning workspace',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Planner' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Prevent theme flash by reading from localStorage before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var c = localStorage.getItem('theme-colors');
                  if (c) {
                    var t = JSON.parse(c);
                    var r = document.documentElement.style;
                    r.setProperty('--bg', t.bg);
                    r.setProperty('--surface', t.surface);
                    r.setProperty('--surface-2', t.surface2);
                    r.setProperty('--line', t.line);
                    r.setProperty('--text', t.text);
                    r.setProperty('--text-muted', t.textMuted);
                    r.setProperty('--text-faint', t.textFaint);
                    r.setProperty('--accent', t.accent);
                    r.setProperty('--accent-soft', t.accent + '20');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
