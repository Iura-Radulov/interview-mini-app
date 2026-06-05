'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProfileData } from '@/types';
import { getTheme } from '@/lib/telegram';
import { useAuth } from '@/components/TelegramProvider';
import { getProfile } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import LoadingSpinner from './LoadingSpinner';
import Sidebar from './Sidebar';

function planBadgeColor(planName: string) {
  switch (planName) {
    case 'Pro':
      return { bg: '#22c55e20', text: '#22c55e', border: '#22c55e' };
    case 'Premium':
      return { bg: '#a855f720', text: '#a855f7', border: '#a855f7' };
    default:
      return { bg: '#64748b20', text: '#64748b', border: '#64748b33' };
  }
}

function getUpgradeLabel(planName: string, t: (key: string) => string): string {
  if (planName === 'Free') return t('profile.upgrade_pro');
  if (planName === 'Pro') return t('profile.upgrade_premium');
  return '';
}

function getUpgradeUrl(planName: string): string {
  if (planName === 'Free') return 'https://techinterviewai.com/tariffs?plan=pro';
  if (planName === 'Pro') return 'https://techinterviewai.com/tariffs?plan=premium';
  return '';
}

function getPlanFeatures(planName: string, t: (key: string) => string): string[] {
  if (planName === 'Free') {
    return [t('plan.feature.0'), t('plan.feature.1'), t('plan.feature.2'), t('plan.feature.3')];
  }
  if (planName === 'Pro') {
    return [t('plan.pro.feature.0'), t('plan.pro.feature.1'), t('plan.pro.feature.2'), t('plan.pro.feature.3'), t('plan.pro.feature.4'), t('plan.pro.feature.5'), t('plan.pro.feature.6')];
  }
  if (planName === 'Premium') {
    return [t('plan.premium.feature.0'), t('plan.premium.feature.1'), t('plan.premium.feature.2'), t('plan.premium.feature.3'), t('plan.premium.feature.4'), t('plan.premium.feature.5')];
  }
  return [];
}

export default function ProfileStats() {
  const { t, uiLang } = useTranslation();
  const theme = getTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : t('profile.failed_load')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={() => { setLoading(true); setError(null); getProfile().then(setProfile).catch(err => setError(err.message)).finally(() => setLoading(false)); }}
          className="px-6 py-3 rounded-2xl font-medium text-sm"
          style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
        >
          {t('profile.retry')}
        </button>
      </div>
    );
  }

  const planName = profile?.plan_name || 'Free';
  const features = profile?.features?.length
    ? (uiLang === 'ru' && profile.features_ru?.length ? profile.features_ru : profile.features)
    : [];
  const badge = planBadgeColor(planName);
  const upgradeLabel = getUpgradeLabel(planName, t);
  const upgradeUrl = getUpgradeUrl(planName);

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className="min-h-screen flex flex-col px-4 py-6 max-w-sm mx-auto"
        style={{ backgroundColor: theme.bg_color, color: theme.text_color }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90"
            style={{ backgroundColor: theme.secondary_bg_color }}
            aria-label="Open menu"
          >
            ☰
          </button>
          <h1 className="text-xl font-bold">{t('profile.my_profile')}</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: theme.hint_color }}>
              {user?.first_name || ''}
            </span>
            <button
              onClick={() => router.push('/profile')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold active:scale-95 transition-all"
              style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
            >
              {user?.first_name?.[0] || 'U'}
            </button>
          </div>
        </div>

        {/* User info card */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl" style={{ backgroundColor: theme.secondary_bg_color }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
          >
            {user?.first_name?.[0] || 'U'}
          </div>
          <div>
            <p className="text-lg font-bold">{user?.first_name || t('profile.user')}</p>
            <p className="text-sm" style={{ color: theme.hint_color }}>
              {profile?.total_sessions && profile.total_sessions > 0
                ? t('profile.sessions_completed', { count: profile.total_sessions })
                : t('profile.getting_started')}
            </p>
            {profile?.avg_score && profile.avg_score > 0 && (
              <p className="text-sm mt-1" style={{ color: '#22c55e' }}>
                {t('profile.avg_score', { score: profile.avg_score.toFixed(1) })}
              </p>
            )}
          </div>
        </div>

        {/* Subscription block */}
        <div
          className="p-5 rounded-2xl mb-6 border"
          style={{
            backgroundColor: badge.bg,
            borderColor: badge.border,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.hint_color }}>
                {t('profile.subscription')}
              </p>
              <p className="text-xl font-bold" style={{ color: badge.text }}>
                {planName}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ backgroundColor: planName === 'Free' ? '#64748b30' : planName === 'Pro' ? '#22c55e30' : '#a855f730' }}
            >
              {planName === 'Free' ? '📦' : planName === 'Pro' ? '⚡' : '👑'}
            </div>
          </div>

          <div className="space-y-2">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-sm" style={{ color: badge.text }}>✓</span>
                <span className="text-sm" style={{ color: theme.text_color }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {upgradeLabel && (
            <button
              onClick={() => window.open(upgradeUrl, '_blank')}
              className="w-full mt-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{ backgroundColor: badge.text, color: '#ffffff' }}
            >
              {upgradeLabel}
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/setup')}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor: theme.button_color,
              color: theme.button_text_color,
            }}
          >
            {t('profile.start_new')}
          </button>
          <button
            onClick={() => router.push('/history')}
            className="w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-95"
            style={{ backgroundColor: theme.secondary_bg_color, color: theme.text_color }}
          >
            {t('profile.view_history')}
          </button>
        </div>
      </div>
    </>
  );
}
