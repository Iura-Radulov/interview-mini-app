'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { TelegramUser } from '@/types';
import { getTheme, getInitData } from '@/lib/telegram';
import { setInitData, auth, setUserId } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';

const LANDING_AUTH_URL = 'https://techinterviewai.com/api/auth/me';

interface AuthContextValue {
  user: TelegramUser | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    user: TelegramUser | null;
    error: string | null;
  }>({ user: null, error: null });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Safely call Telegram WebApp methods
      try {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
        }
      } catch {
        // ignore telegram errors
      }

      const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
      const initDataStr = getInitData();

      // No Telegram context — try landing auth
      if (!initDataStr) {
        try {
          const res = await fetch(LANDING_AUTH_URL, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.telegramId) {
              if (!cancelled) {
                setUserId(data.telegramId);
                setState({
                  user: { id: data.telegramId, username: data.username, first_name: data.firstName },
                  error: null,
                });
              }
              return;
            }
          }
        } catch {
          // landing auth failed
        }

        // Not authenticated anywhere — redirect to landing login
        if (!cancelled) {
          if (typeof window !== 'undefined') {
            window.location.href = 'https://techinterviewai.com/auth/login?redirect=' + encodeURIComponent(window.location.href);
          }
        }
        return;
      }

      setInitData(initDataStr);

      // Try auth with timeout
      try {
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        );
        const result = await Promise.race([auth(), timeoutPromise]);
        if (!cancelled) {
          if (result && result.ok && result.user) {
            setState({ user: result.user, error: null });
          } else {
            // Auth failed - still let user in
            setState({ user: { id: 0, first_name: 'User' }, error: null });
          }
        }
      } catch {
        if (!cancelled) {
          setState({ user: { id: 0, first_name: 'User' }, error: null });
        }
      }
    }

    init();

    return () => { cancelled = true; };
  }, []);

  // Show spinner ONLY on first render while init runs
  if (!state.user && !state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (state.error && !state.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-xs" style={{ color: getTheme().text_color }}>
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-base font-medium mb-2">Authentication Error</p>
          <p className="text-sm opacity-70">{state.error}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: state.user, loading: false, error: state.error }}>
      {children}
    </AuthContext.Provider>
  );
}