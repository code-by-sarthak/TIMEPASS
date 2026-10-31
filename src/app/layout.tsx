import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { AuthProvider } from '@/lib/auth-context';
import { MusicProvider } from '@/lib/music-context';
import MobileBottomNav from '@/components/MobileBottomNav';

export const metadata: Metadata = {
  title: 'TIMEPASS — Meet Someone New. Anytime.',
  description: 'Random one-to-one video calls and instant text chat with people worldwide. Fast, secure, and modern.',
  keywords: 'random video chat, omegle alternative, video call strangers, online meet, timepass',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#090a14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>" />
      </head>
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        <ThemeProvider>
          <AuthProvider>
            <MusicProvider>
              {children}
              <MobileBottomNav />
            </MusicProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
