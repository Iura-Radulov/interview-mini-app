import type { Metadata, Viewport } from 'next';
import './globals.css';
import TelegramProvider from '@/components/TelegramProvider';
import { I18nProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'AI Interview Practice',
  description: 'Practice technical interviews with AI feedback',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        <script src="https://telegram.org/js/telegram-web-app.js" />
        <TelegramProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </TelegramProvider>
      </body>
    </html>
  );
}
