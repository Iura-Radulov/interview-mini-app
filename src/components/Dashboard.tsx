'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTheme } from '@/lib/telegram';
import { useAuth } from '@/components/TelegramProvider';
import { getProfile } from '@/lib/api';
import type { ProfileData } from '@/types';
import { useTranslation } from '@/lib/i18n';
import LoadingSpinner from './LoadingSpinner';
import Sidebar from './Sidebar';

function scoreColor(score: number): string {
  if (score >= 7) return '#22c55e';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

const PLAN_ORDER: Record<string, number> = {
  Free: 0,
  Pro: 1,
  Premium: 2,
};

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

export default function Dashboard() {
  const theme = getTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : t('dashboard.failed_load')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
          onClick={() => { setLoading(true); setError(null); fetchProfile(); }}
          className="px-6 py-3 rounded-2xl font-medium text-sm"
          style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
        >
          {t('dashboard.retry')}
        </button>
      </div>
    );
  }

  const planName = profile?.plan_name || 'Free';
  const monthlySessions = profile?.total_sessions ?? 0;
  const monthlyLimit = profile?.max_per_month ?? 2;
  const avgScore = profile?.avg_score ?? 0;
  const totalCompleted = profile?.total_completed ?? 0;

  const badge = planBadgeColor(planName);

  const getUpgradeLabel = (pn: string): string => {
    if (pn === 'Free') return t('dashboard.upgrade_pro');
    if (pn === 'Pro') return t('dashboard.upgrade_premium');
    return '';
  };

  const getUpgradeUrl = (pn: string): string => {
    if (pn === 'Free') return 'https://techinterviewai.com/tariffs?plan=pro';
    if (pn === 'Pro') return 'https://techinterviewai.com/tariffs?plan=premium';
    return '';
  };

  const upgradeLabel = getUpgradeLabel(planName);
  const upgradeUrl = getUpgradeUrl(planName);

  const planDesc = planName === 'Free' ? t('dashboard.plan_free') : planName === 'Pro' ? t('dashboard.plan_pro') : t('dashboard.plan_premium');

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className="min-h-screen flex flex-col px-4 py-6 max-w-sm mx-auto relative"
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

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">
            {t('dashboard.welcome')}{user?.first_name ? `, ${user.first_name}` : ''}
          </h1>
          <p className="text-sm" style={{ color: theme.hint_color }}>
            {t('dashboard.ready')}
          </p>
        </div>

        {/* Plan badge */}
        <div
          className="flex items-center justify-between p-4 rounded-2xl mb-6 border"
          style={{
            backgroundColor: badge.bg,
            borderColor: badge.border,
          }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.hint_color }}>
              {t('dashboard.current_plan')}
            </p>
            <p className="text-lg font-bold" style={{ color: badge.text }}>
              {planName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: theme.hint_color }}>
              {planDesc}
            </p>
          </div>
          {upgradeLabel && (
            <button
              onClick={() => window.open(upgradeUrl, '_blank')}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{ backgroundColor: badge.text, color: '#ffffff' }}
            >
              {upgradeLabel}
            </button>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div
            className="p-4 rounded-2xl text-center"
            style={{ backgroundColor: theme.secondary_bg_color }}
          >
            <p className="text-2xl font-bold">{monthlySessions}</p>
            <p className="text-[10px] mt-1 uppercase tracking-wide" style={{ color: theme.hint_color }}>
              {t('dashboard.this_month')}
            </p>
            {planName === 'Free' && (
              <p className="text-[10px] mt-0.5" style={{ color: monthlySessions >= monthlyLimit ? '#ef4444' : theme.hint_color }}>
                {t('dashboard.of')} {monthlyLimit}
              </p>
            )}
          </div>
          <div
            className="p-4 rounded-2xl text-center"
            style={{ backgroundColor: theme.secondary_bg_color }}
          >
            <p className="text-2xl font-bold">{totalCompleted}</p>
            <p className="text-[10px] mt-1 uppercase tracking-wide" style={{ color: theme.hint_color }}>
              {t('dashboard.completed')}
            </p>
          </div>
          <div
            className="p-4 rounded-2xl text-center"
            style={{ backgroundColor: theme.secondary_bg_color }}
          >
            <p
              className="text-2xl font-bold"
              style={{ color: scoreColor(avgScore) }}
            >
              {avgScore.toFixed(1)}
            </p>
            <p className="text-[10px] mt-1 uppercase tracking-wide" style={{ color: theme.hint_color }}>
              {t('dashboard.avg_score')}
            </p>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.hint_color }}>
            {t('dashboard.recent_sessions')}
          </p>
          {!profile || profile.recent_sessions.length === 0 ? (
            <div
              className="p-6 rounded-2xl text-center"
              style={{ backgroundColor: theme.secondary_bg_color }}
            >
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-sm" style={{ color: theme.hint_color }}>
                {t('dashboard.no_sessions')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {profile.recent_sessions.slice(0, 2).map((session, idx) => (
                <button
                  key={session?.id ?? `session-${idx}`}
                  onClick={() => router.push(`/summary?session=${session.id}`)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all active:scale-98"
                  style={{ backgroundColor: theme.secondary_bg_color }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.text_color }}>
                      {session.role} · {session.experience_level}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: theme.hint_color }}>
                      {formatDate(session.started_at)}
                      {!session.completed && ` · ${t('dashboard.in_progress')}`}
                    </p>
                  </div>
                  {session.total_score != null && (
                    <span className="font-bold text-base" style={{ color: scoreColor(session.total_score) }}>
                      {session.total_score.toFixed(1)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Start Interview button */}
        <button
          onClick={() => router.push('/setup')}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
          style={{
            backgroundColor: theme.button_color,
            color: theme.button_text_color,
            boxShadow: `0 4px 16px ${theme.button_color}44`,
          }}
        >
          {t('dashboard.start_interview')}
        </button>
      </div>
    </>
  );
}
