'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SessionSummary, AnswerItem, InterviewMode } from '@/types';
import { getTheme } from '@/lib/telegram';
import { useTranslation } from '@/lib/i18n';

interface Props {
  summary: SessionSummary;
  answers: AnswerItem[];
  overallScore: number;
  mode?: InterviewMode;
}

function scoreColor(score: number): string {
  if (score >= 7) return '#22c55e';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

function AnimatedScore({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * target * 10) / 10);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return <>{displayed.toFixed(1)}</>;
}

function AnswerBreakdown({ item }: { item: AnswerItem }) {
  const theme = getTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const color = scoreColor(item.evaluation.score);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: theme.secondary_bg_color }}
    >
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-medium flex-1 pr-4 line-clamp-2" style={{ color: theme.text_color }}>
          Q{item.question_number}: {item.question.question}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-base" style={{ color }}>
            {item.evaluation.score}/10
          </span>
          <span style={{ color: theme.hint_color }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: `${theme.hint_color}22` }}>
          <div className="pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.hint_color }}>
              {t('summary_card.your_answer')}
            </p>
            <p className="text-sm" style={{ color: theme.text_color }}>{item.answer}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.hint_color }}>
              {t('summary_card.feedback')}
            </p>
            <p className="text-sm" style={{ color: theme.text_color }}>{item.evaluation.feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SummaryCard({ summary, answers, overallScore }: Props) {
  const { t } = useTranslation();
  const theme = getTheme();
  const router = useRouter();
  const color = scoreColor(overallScore);

  const ratingColors: Record<string, string> = {
    excellent: '#22c55e',
    good: '#84cc16',
    average: '#f59e0b',
    poor: '#ef4444',
  };
  const ratingColor = ratingColors[summary.overall_rating?.toLowerCase()] ?? theme.button_color;

  return (
    <div
      className="min-h-screen flex flex-col px-4 py-6 max-w-sm mx-auto"
      style={{ backgroundColor: theme.bg_color, color: theme.text_color }}
    >
      <h1 className="text-xl font-bold text-center mb-6">{t('summary_card.title')}</h1>

      <div className="flex flex-col items-center mb-6">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center font-bold text-4xl mb-3"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <AnimatedScore target={overallScore} />
        </div>
        <span
          className="px-4 py-1 rounded-full text-sm font-semibold capitalize"
          style={{ backgroundColor: `${ratingColor}20`, color: ratingColor }}
        >
          {summary.overall_rating}
        </span>
      </div>

      {summary.overall_assessment && (
        <div
          className="p-4 rounded-2xl text-sm leading-relaxed mb-4"
          style={{ backgroundColor: theme.secondary_bg_color }}
        >
          {summary.overall_assessment}
        </div>
      )}

      {/* STAR breakdown — behavioral mode */}
      {summary.star_breakdown && (
        <div
          className="p-4 rounded-2xl mb-4"
          style={{ backgroundColor: theme.secondary_bg_color }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#8b5cf6' }}>
            ⭐ STAR Overall: {summary.star_breakdown.overall_star_score}/10
          </p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>S — Situation</span>
                <span style={{ color: scoreColor(summary.star_breakdown.situation) }}>{summary.star_breakdown.situation}/10</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 5, backgroundColor: '#e5e7eb' }}>
                <div className="h-full rounded-full" style={{ width: `${(summary.star_breakdown.situation / 10) * 100}%`, backgroundColor: scoreColor(summary.star_breakdown.situation) }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>T — Task</span>
                <span style={{ color: scoreColor(summary.star_breakdown.task) }}>{summary.star_breakdown.task}/10</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 5, backgroundColor: '#e5e7eb' }}>
                <div className="h-full rounded-full" style={{ width: `${(summary.star_breakdown.task / 10) * 100}%`, backgroundColor: scoreColor(summary.star_breakdown.task) }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>A — Action</span>
                <span style={{ color: scoreColor(summary.star_breakdown.action) }}>{summary.star_breakdown.action}/10</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 5, backgroundColor: '#e5e7eb' }}>
                <div className="h-full rounded-full" style={{ width: `${(summary.star_breakdown.action / 10) * 100}%`, backgroundColor: scoreColor(summary.star_breakdown.action) }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>R — Result</span>
                <span style={{ color: scoreColor(summary.star_breakdown.result) }}>{summary.star_breakdown.result}/10</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 5, backgroundColor: '#e5e7eb' }}>
                <div className="h-full rounded-full" style={{ width: `${(summary.star_breakdown.result / 10) * 100}%`, backgroundColor: scoreColor(summary.star_breakdown.result) }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competency scores — behavioral mode */}
      {summary.competency_scores && Object.keys(summary.competency_scores).length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#8b5cf6' }}>
            🎯 Key Competencies
          </p>
          <div className="space-y-2">
            {Object.entries(summary.competency_scores).map(([comp, score]) => (
              <div
                key={comp}
                className="p-3 rounded-xl flex items-center justify-between"
                style={{ backgroundColor: theme.secondary_bg_color }}
              >
                <span className="text-sm font-medium">{comp}</span>
                <span className="font-bold text-sm" style={{ color: scoreColor(score) }}>
                  {Math.round(score * 10) / 10}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.key_strengths.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#22c55e' }}>
            {t('summary_card.key_strengths')}
          </p>
          <ul className="space-y-1">
            {summary.key_strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.key_improvements.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#f59e0b' }}>
            {t('summary_card.areas_improve')}
          </p>
          <ul className="space-y-1">
            {summary.key_improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-amber-500 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.topics_to_study.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.button_color }}>
            {t('summary_card.topics_study')}
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.topics_to_study.map((topic, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${theme.button_color}15`, color: theme.button_color }}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {answers.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.hint_color }}>
            {t('summary_card.question_breakdown')}
          </p>
          <div className="space-y-2">
            {answers.map((item) => (
              <AnswerBreakdown key={item.question_number} item={item} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 mt-auto">
        <button
          onClick={() => router.push('/')}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95"
          style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
        >
          {t('summary_card.practice_again')}
        </button>
        <Link
          href="/profile"
          className="block w-full py-3 text-center rounded-2xl text-sm font-medium"
          style={{ color: theme.button_color }}
        >
          {t('summary_card.view_profile')}
        </Link>
      </div>
    </div>
  );
}
