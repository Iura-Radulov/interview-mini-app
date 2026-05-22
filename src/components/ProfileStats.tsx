'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ProfileData, InterviewSession } from '@/types';
import { getTheme } from '@/lib/telegram';
import { getProfile } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';

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

export default function ProfileStats() {
  const theme = getTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile.'))
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
        <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-2xl font-medium text-sm"
          style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div
      className="min-h-screen flex flex-col px-4 py-6 max-w-sm mx-auto"
      style={{ backgroundColor: theme.bg_color, color: theme.text_color }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">My Profile</h1>
        <Link href="/" className="text-sm" style={{ color: theme.button_color }}>
          ← Home
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div
          className="p-4 rounded-2xl text-center"
          style={{ backgroundColor: theme.secondary_bg_color }}
        >
          <p className="text-3xl font-bold">{profile.total_sessions}</p>
          <p className="text-xs mt-1" style={{ color: theme.hint_color }}>Sessions</p>
        </div>
        <div
          className="p-4 rounded-2xl text-center"
          style={{ backgroundColor: theme.secondary_bg_color }}
        >
          <p
            className="text-3xl font-bold"
            style={{ color: scoreColor(profile.avg_score) }}
          >
            {profile.avg_score.toFixed(1)}
          </p>
          <p className="text-xs mt-1" style={{ color: theme.hint_color }}>Avg Score</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.hint_color }}>
          Recent Sessions
        </p>
        {profile.recent_sessions.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: theme.hint_color }}>
            No sessions yet. Start your first interview!
          </p>
        ) : (
          <div className="space-y-2">
            {profile.recent_sessions.map((session, idx) => (
              <SessionRow key={session?.id ?? `session-${idx}`} session={session} theme={theme} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto">
        <button
          onClick={() => router.push('/')}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95"
          style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
}

function SessionRow({
  session,
  theme,
}: {
  session: InterviewSession;
  theme: ReturnType<typeof getTheme>;
}) {
  const router = useRouter();
  const color = session.total_score != null ? scoreColor(session.total_score) : theme.hint_color;

  return (
    <button
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
          {!session.completed && ' · In progress'}
        </p>
      </div>
      {session.total_score != null && (
        <span className="font-bold text-base" style={{ color }}>
          {session.total_score.toFixed(1)}
        </span>
      )}
    </button>
  );
}
