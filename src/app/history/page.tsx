'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTheme } from '@/lib/telegram';
import { useAuth } from '@/components/TelegramProvider';
import { getProfile } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import type { ProfileData, InterviewSession } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';

function scoreColor(score: number): string {
  if (score >= 7) return '#22c55e';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const { t } = useTranslation();
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
      .catch((err) => setError(err instanceof Error ? err.message : t('history.failed_load')))
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
          {t('history.retry')}
        </button>
      </div>
    );
  }

  const totalSessions = profile?.total_sessions ?? 0;
  const totalCompleted = profile?.total_completed ?? 0;
  const avgScore = profile?.avg_score ?? 0;
  const sessions = profile?.recent_sessions ?? [];

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
          <h1 className="text-xl font-bold">{t('history.title')}</h1>
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

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div
            className="p-4 rounded-2xl text-center"
            style={{ backgroundColor: theme.secondary_bg_color }}
          >
            <p className="text-2xl font-bold">{totalSessions}</p>
            <p className="text-[10px] mt-1 uppercase tracking-wide" style={{ color: theme.hint_color }}>
              {t('history.total')}
            </p>
          </div>
          <div
            className="p-4 rounded-2xl text-center"
            style={{ backgroundColor: theme.secondary_bg_color }}
          >
            <p className="text-2xl font-bold">{totalCompleted}</p>
            <p className="text-[10px] mt-1 uppercase tracking-wide" style={{ color: theme.hint_color }}>
              {t('history.completed')}
            </p>
          </div>
          <div
            className="p-4 rounded-2xl text-center"
            style={{ backgroundColor: theme.secondary_bg_color }}
          >
            <p className="text-2xl font-bold" style={{ color: scoreColor(avgScore) }}>
              {avgScore.toFixed(1)}
            </p>
            <p className="text-[10px] mt-1 uppercase tracking-wide" style={{ color: theme.hint_color }}>
              {t('history.avg_score')}
            </p>
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.hint_color }}>
            {t('history.all_sessions')}
          </p>

          {sessions.length === 0 ? (
            <div
              className="p-8 rounded-2xl text-center"
              style={{ backgroundColor: theme.secondary_bg_color }}
            >
              <p className="text-4xl mb-3">🎯</p>
              <p className="text-sm" style={{ color: theme.hint_color }}>
                {t('history.empty_text')}
              </p>
              <p className="text-xs mt-1" style={{ color: theme.hint_color }}>
                {t('history.empty_hint')}
              </p>
              <button
                onClick={() => router.push('/setup')}
                className="mt-4 px-6 py-3 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
              >
                {t('history.start_interview')}
              </button>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {sessions.map((session, idx) => (
                <SessionCard key={session?.id ?? `session-${idx}`} session={session} theme={theme} router={router} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SessionCard({
  session,
  theme,
  router,
}: {
  session: InterviewSession;
  theme: ReturnType<typeof getTheme>;
  router: ReturnType<typeof useRouter>;
}) {
  const { t } = useTranslation();
  const color = session.total_score != null ? scoreColor(session.total_score) : theme.hint_color;

  return (
    <button
      onClick={() => router.push(`/summary?session=${session.id}`)}
      className="w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all active:scale-98"
      style={{ backgroundColor: theme.secondary_bg_color }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold truncate" style={{ color: theme.text_color }}>
            {session.role}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
            style={{
              backgroundColor: `${theme.hint_color}20`,
              color: theme.hint_color,
            }}
          >
            {session.experience_level}
          </span>
          {session.mode && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
              style={{
                backgroundColor: session.mode === 'behavioral' ? '#f59e0b20' : '#3b82f620',
                color: session.mode === 'behavioral' ? '#f59e0b' : '#3b82f6',
              }}
            >
              {session.mode === 'behavioral' ? '💬' : '🔧'}
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: theme.hint_color }}>
          {formatDate(session.started_at)}
          {!session.completed && (
            <span className="ml-2" style={{ color: '#f59e0b' }}>
              {t('history.in_progress')}
            </span>
          )}
        </p>
      </div>
      {session.total_score != null && (
        <div className="flex items-center gap-1 ml-3">
          <span className="font-bold text-base" style={{ color }}>
            {session.total_score.toFixed(1)}
          </span>
          <span className="text-[10px]" style={{ color: theme.hint_color }}>/10</span>
        </div>
      )}
      {!session.completed && (
        <div className="ml-3 px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
          {t('history.resume')}
        </div>
      )}
    </button>
  );
}
