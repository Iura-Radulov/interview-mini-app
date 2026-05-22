'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SessionSummary, AnswerItem } from '@/types';
import { getTheme } from '@/lib/telegram';

interface Props {
  summary: SessionSummary;
  answers: AnswerItem[];
  overallScore: number;
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
              Your Answer
            </p>
            <p className="text-sm" style={{ color: theme.text_color }}>{item.answer}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.hint_color }}>
              Feedback
            </p>
            <p className="text-sm" style={{ color: theme.text_color }}>{item.evaluation.feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SummaryCard({ summary, answers, overallScore }: Props) {
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
      <h1 className="text-xl font-bold text-center mb-6">Session Summary</h1>

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

      {summary.key_strengths.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#22c55e' }}>
            Key Strengths
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
            Areas to Improve
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
            Topics to Study
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
            Question Breakdown
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
          Practice Again
        </button>
        <Link
          href="/profile"
          className="block w-full py-3 text-center rounded-2xl text-sm font-medium"
          style={{ color: theme.button_color }}
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
