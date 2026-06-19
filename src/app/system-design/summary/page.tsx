'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTheme } from '@/lib/telegram';
import { useAuth } from '@/components/TelegramProvider';
import { getSystemDesignSession } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import type { SystemDesignSessionDetail, SdEvalSummary } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';

const STEP_COMPONENTS = [
  { key: 'requirements_clarity', labelKey: 'sd.component_requirements' },
  { key: 'estimations', labelKey: 'sd.component_estimations' },
  { key: 'data_model', labelKey: 'sd.component_data_model' },
  { key: 'api_design', labelKey: 'sd.component_api_design' },
  { key: 'architecture', labelKey: 'sd.component_architecture' },
  { key: 'deep_dive', labelKey: 'sd.component_deep_dive' },
  { key: 'trade_offs', labelKey: 'sd.component_tradeoffs' },
];

function scoreBarColor(score: number): string {
  if (score >= 7) return '#22c55e';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

export default function SdSummaryPage() {
  const theme = getTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SystemDesignSessionDetail | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sessionId = searchParams.get('session');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }
    getSystemDesignSession(Number(sessionId))
      .then((s) => {
        setSession(s);
        if (!s.completed) {
          // Not completed — redirect to the interview page
          router.replace(`/system-design/interview?session=${s.id}`);
          return;
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg_color }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4" style={{ backgroundColor: theme.bg_color, color: theme.text_color }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={() => router.push('/history')}
          className="px-6 py-3 rounded-2xl font-medium text-sm"
          style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
        >
          {t('history.title')}
        </button>
      </div>
    );
  }

  const sd = session!;
  const summary = sd.summary as SdEvalSummary | null;

  if (!summary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4" style={{ backgroundColor: theme.bg_color, color: theme.text_color }}>
        <p className="text-sm" style={{ color: theme.hint_color }}>No evaluation found for this session.</p>
        <button onClick={() => router.push('/history')} className="px-6 py-3 rounded-2xl font-medium text-sm" style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}>
          {t('history.title')}
        </button>
      </div>
    );
  }

  const comps = STEP_COMPONENTS.map((c) => ({
    ...c,
    score: (summary as any)[c.key] as number ?? 5,
  }));

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-h-screen flex flex-col px-4 py-6 max-w-sm mx-auto" style={{ backgroundColor: theme.bg_color, color: theme.text_color }}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90" style={{ backgroundColor: theme.secondary_bg_color }}>☰</button>
          <h1 className="text-xl font-bold">{t('sd.evaluation_title')}</h1>
          <button onClick={() => router.push('/history')} className="text-sm transition-all active:scale-95" style={{ color: theme.hint_color }}>{t('sd.back')}</button>
        </div>

        {/* Session info */}
        <div className="mb-4 p-3 rounded-2xl flex items-center gap-3" style={{ backgroundColor: theme.secondary_bg_color }}>
          <span className="text-lg">🏗️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{sd.problem}</p>
            <p className="text-[10px]" style={{ color: theme.hint_color }}>{sd.level} · {sd.started_at ? new Date(sd.started_at).toLocaleDateString() : ''}</p>
          </div>
        </div>

        {/* Overall score */}
        <div className="text-center mb-6 p-5 rounded-2xl" style={{ backgroundColor: theme.secondary_bg_color }}>
          <div className="text-4xl mb-2">🏗️</div>
          <p className="text-3xl font-bold" style={{ color: scoreBarColor(summary.overall) }}>{summary.overall.toFixed(1)}</p>
          <p className="text-xs" style={{ color: theme.hint_color }}>{t('sd.evaluation_overall', { score: summary.overall.toFixed(1) })}</p>
        </div>

        {/* Component scores */}
        <div className="space-y-3 mb-6">
          {comps.map((c) => (
            <div key={c.key} className="flex items-center gap-3">
              <span className="text-xs w-28 shrink-0">{t(c.labelKey)}</span>
              <div className="flex-1 h-2.5 rounded-full" style={{ backgroundColor: `${theme.hint_color}25` }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(c.score / 10) * 100}%`, backgroundColor: scoreBarColor(c.score) }} />
              </div>
              <span className="text-xs font-bold w-4 text-right" style={{ color: scoreBarColor(c.score) }}>{c.score}</span>
            </div>
          ))}
        </div>

        {/* Assessment */}
        {summary.assessment && (
          <div className="p-4 rounded-2xl mb-4 text-sm leading-relaxed" style={{ backgroundColor: theme.secondary_bg_color }}>
            <p>{summary.assessment}</p>
          </div>
        )}

        {/* Strengths */}
        {summary.strengths.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">{t('sd.strengths')}</p>
            <ul className="space-y-1">
              {summary.strengths.map((s, i) => (
                <li key={i} className="text-sm" style={{ color: theme.text_color }}>• {s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {summary.improvements.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2" style={{ color: '#f59e0b' }}>{t('sd.improvements')}</p>
            <ul className="space-y-1">
              {summary.improvements.map((s, i) => (
                <li key={i} className="text-sm" style={{ color: theme.text_color }}>• {s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Topics to study */}
        {summary.topics_to_study.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold mb-2" style={{ color: theme.button_color }}>{t('sd.topics')}</p>
            <ul className="space-y-1">
              {summary.topics_to_study.map((s, i) => (
                <li key={i} className="text-sm" style={{ color: theme.text_color }}>• {s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-auto space-y-3">
          <button onClick={() => router.push('/system-design')} className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95" style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}>
            {t('sd.practice_again')}
          </button>
          <button onClick={() => router.push('/history')} className="w-full py-3 rounded-2xl font-medium text-sm transition-all active:scale-95" style={{ backgroundColor: `${theme.button_color}12`, color: theme.button_color }}>
            {t('history.title')}
          </button>
        </div>
      </div>
    </>
  );
}
