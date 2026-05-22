'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { SessionSummary, AnswerItem, InterviewSession } from '@/types';
import { getSession } from '@/lib/api';
import { getTheme } from '@/lib/telegram';
import SummaryCard from '@/components/SummaryCard';
import LoadingSpinner from '@/components/LoadingSpinner';

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

/** Normalize flat API answer to AnswerItem format */
function normalizeAnswer(raw: Record<string, unknown>): AnswerItem {
  return {
    question_number: (raw.question_number as number) ?? 0,
    question: {
      question: (raw.question_text as string) ?? (raw.question as string | undefined) ?? '',
      category: (raw.category as string) ?? 'Technical',
      expected_topics: (raw.expected_topics as string[]) ?? [],
      difficulty: (raw.difficulty as string) ?? '',
    },
    answer: (raw.user_answer as string) ?? (raw.answer as string | undefined) ?? '',
    evaluation: {
      score: (raw.score as number) ?? (raw.evaluation as { score?: number } | undefined)?.score ?? 0,
      feedback: (raw.feedback as string) ?? (raw.evaluation as { feedback?: string } | undefined)?.feedback ?? '',
      strengths: (raw.strengths as string[]) ?? (raw.evaluation as { strengths?: string[] } | undefined)?.strengths ?? [],
      improvements: (raw.improvements as string[]) ?? (raw.evaluation as { improvements?: string[] } | undefined)?.improvements ?? [],
      tip: (raw.tip as string) ?? (raw.evaluation as { tip?: string } | undefined)?.tip ?? '',
    },
  };
}

/** Detect if API returned flat format */
function isFlatAnswer(raw: Record<string, unknown>): boolean {
  return 'question_text' in raw || 'user_answer' in raw || 'score' in raw;
}

interface SessionDetailData {
  session: InterviewSession;
  answers: AnswerItem[];
  summary: SessionSummary | null;
  overallScore: number;
}

export default function SummaryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = getTheme();
  const sessionId = Number(searchParams.get('session') ?? '0');

  const [data, setData] = useState<SessionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/');
      return;
    }

    const stored = sessionStorage.getItem(`summary_${sessionId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { summary: SessionSummary; answers: AnswerItem[] };
        const avg =
          parsed.answers.length > 0
            ? parsed.answers.reduce((sum, a) => sum + a.evaluation.score, 0) / parsed.answers.length
            : 0;
        setData({
          session: { id: sessionId, role: '', experience_level: '', started_at: '', completed: true },
          summary: parsed.summary,
          answers: parsed.answers,
          overallScore: Math.round(avg * 10) / 10,
        });
        setLoading(false);
        return;
      } catch {
        // fallback to API
      }
    }

    getSession(sessionId)
      .then((res) => {
        // Normalize answers from API (flat format → AnswerItem format)
        const rawAnswers = (res.answers as unknown as Record<string, unknown>[]) ?? [];
        const answers: AnswerItem[] = rawAnswers.map((a) =>
          isFlatAnswer(a) ? normalizeAnswer(a) : (a as unknown as AnswerItem)
        );

        const avg =
          answers.length > 0
            ? answers.reduce((sum, a) => sum + a.evaluation.score, 0) / answers.length
            : res.session.total_score ?? 0;

        setData({
          session: res.session,
          answers,
          summary: res.summary ?? null,
          overallScore: Math.round(avg * 10) / 10,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load session.'))
      .finally(() => setLoading(false));
  }, [sessionId, router]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.bg_color }}
      >
        <LoadingSpinner size="lg" color={theme.button_color} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 gap-4"
        style={{ backgroundColor: theme.bg_color, color: theme.text_color }}
      >
        <p className="text-sm text-center" style={{ color: '#ef4444' }}>
          {error}
        </p>
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

  if (!data) return null;

  // Completed session — show full summary
  if (data.session.completed && data.summary) {
    return (
      <SummaryCard
        summary={data.summary}
        answers={data.answers}
        overallScore={data.overallScore}
      />
    );
  }

  // In-progress session — show progress
  const totalQuestions = 5;
  const answeredCount = data.answers.length;

  return (
    <div
      className="min-h-screen flex flex-col px-4 py-6 max-w-sm mx-auto"
      style={{ backgroundColor: theme.bg_color, color: theme.text_color }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Interview in Progress</h1>
        <Link href="/profile" className="text-sm" style={{ color: theme.button_color }}>
          ← Profile
        </Link>
      </div>

      {/* Session info */}
      <div
        className="p-4 rounded-2xl mb-4"
        style={{ backgroundColor: theme.secondary_bg_color }}
      >
        <p className="text-base font-semibold">
          {data.session.role} · {data.session.experience_level}
        </p>
        <p className="text-xs mt-1" style={{ color: theme.hint_color }}>
          Started {formatDate(data.session.started_at)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm" style={{ color: theme.hint_color }}>
            {answeredCount} / {totalQuestions}
          </span>
        </div>
        <div
          className="w-full rounded-full h-2.5 overflow-hidden"
          style={{ backgroundColor: `${theme.hint_color}30` }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(answeredCount / totalQuestions) * 100}%`,
              backgroundColor: theme.button_color,
            }}
          />
        </div>
      </div>

      {/* Answered questions */}
      {data.answers.length > 0 && (
        <div className="mb-6">
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: theme.hint_color }}
          >
            Questions Answered
          </p>
          <div className="space-y-2">
            {data.answers.map((item) => (
              <div
                key={item.question_number}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: theme.secondary_bg_color }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium flex-1">
                    Q{item.question_number}: {item.question.question}
                  </p>
                  <span
                    className="font-bold text-sm shrink-0"
                    style={{
                      color:
                        item.evaluation.score >= 7
                          ? '#22c55e'
                          : item.evaluation.score >= 5
                            ? '#f59e0b'
                            : '#ef4444',
                    }}
                  >
                    {item.evaluation.score}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3 mt-auto">
        <button
          onClick={() => router.push(`/interview?session=${sessionId}&q=${answeredCount + 1}`)}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95"
          style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
        >
          Continue Interview
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-95"
          style={{ backgroundColor: theme.secondary_bg_color, color: theme.text_color }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
