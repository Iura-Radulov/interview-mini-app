'use client';

import { usePathname, useRouter } from 'next/navigation';
import { getTheme, getInitData } from '@/lib/telegram';
import { useAuth } from './TelegramProvider';
import { useTranslation } from '@/lib/i18n';
import { getProfile } from '@/lib/api';
import { useState, useEffect } from 'react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
  premiumOnly?: boolean;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const theme = getTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => setPlanName(p.plan_name))
      .catch(() => setPlanName('Free'));
  }, []);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
  const AUTO_LOGIN_URL = 'https://techinterviewai.com/api/auth/auto-login';
  const RESUME_ANALYSIS_URL = 'https://techinterviewai.com/dashboard/resumes';

  const NAV_ITEMS: NavItem[] = [
    { label: t('nav.dashboard'), href: '/', icon: '🏠' },
    { label: t('nav.start_interview'), href: '/setup', icon: '🎯' },
    { label: t('nav.company'), href: '/company', icon: '🏢', premiumOnly: true },
    { label: t('nav.profile'), href: '/profile', icon: '👤' },
    { label: t('nav.history'), href: '/history', icon: '📋' },
    { label: t('nav.settings'), href: '/settings', icon: '⚙️' },
    { label: t('nav.subscriptions'), href: '/subscriptions', icon: '⭐' },
  ];

  function handleNav(href: string) {
    onClose();
    router.push(href);
  }

  // Overlay (mobile)
  if (open) {
    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        />
        {/* Drawer */}
        <div
          className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col shadow-2xl animate-in"
          style={{
            backgroundColor: theme.secondary_bg_color,
            color: theme.text_color,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: `${theme.hint_color}33` }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}>
                {user?.first_name?.[0] || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold">{user?.first_name || 'User'}</p>
                <p className="text-xs" style={{ color: theme.hint_color }}>Interview AI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:opacity-70 transition-opacity"
              style={{ backgroundColor: `${theme.hint_color}20` }}
            >
              ✕
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.filter((item) => !item.premiumOnly || planName === 'Premium').map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => handleNav(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-98"
                  style={{
                    backgroundColor: isActive ? `${theme.button_color}18` : 'transparent',
                    color: isActive ? theme.button_color : theme.text_color,
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: theme.button_color }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* External link — Resume Analysis */}
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 px-4 py-1">
              <div className="flex-1 h-px" style={{ backgroundColor: `${theme.hint_color}33` }} />
            </div>
            <button
              onClick={async () => {
                onClose();
                try {
                  const initData = getInitData();
                  let url = RESUME_ANALYSIS_URL;
                  if (initData) {
                    const res = await fetch(`${BASE_URL}/api/auth/create-token`, {
                      method: 'POST',
                      headers: { 'X-Telegram-Init-Data': initData },
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.token) {
                        url = `${AUTO_LOGIN_URL}?token=${encodeURIComponent(data.token)}&redirect=${encodeURIComponent('/dashboard/resumes')}`;
                      }
                    }
                  }
                  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.openLink) {
                    (window as any).Telegram.WebApp.openLink(url);
                  } else {
                    window.open(url, '_blank');
                  }
                } catch {
                  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.openLink) {
                    (window as any).Telegram.WebApp.openLink(RESUME_ANALYSIS_URL);
                  } else {
                    window.open(RESUME_ANALYSIS_URL, '_blank');
                  }
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-98"
              style={{ color: theme.hint_color }}
            >
              <span className="text-lg">📄</span>
              <span>{t('nav.resume_analysis')}</span>
              <span className="ml-auto flex items-center gap-1 text-[10px] opacity-60">
                ↗ {t('nav.open_browser')}
              </span>
            </button>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t text-xs" style={{ borderColor: `${theme.hint_color}33`, color: theme.hint_color }}>
            {t('sidebar.footer')}
          </div>
        </div>
      </>
    );
  }

  return null;
}
