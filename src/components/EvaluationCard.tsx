'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Evaluation } from '@/types';
import { getTheme } from '@/lib/telegram';

interface Props {
  evaluation: Evaluation;
  isLast: boolean;
  onNext: () => void;
}

function scoreColor(score: number): string {
  if (score >= 7) return '#22c55e';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

export default function EvaluationCard({ evaluation, isLast, onNext }: Props) {
  const theme = getTheme();
  const router = useRouter();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const color = scoreColor(evaluation.score);

  return (
    <div
      className="flex flex-col gap-4 px-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ color: theme.text_color }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Evaluation</h2>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xl"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {evaluation.score}
          <span className="text-sm font-normal opacity-60">/ 10</span>
        </div>
      </div>

      <div
        className="p-4 rounded-2xl text-sm leading-relaxed select-text"
        style={{ backgroundColor: theme.secondary_bg_color }}
      >
        {evaluation.feedback}
      </div>

      {evaluation.strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#22c55e' }}>
            Strengths
          </p>
          <ul className="space-y-1">
            {evaluation.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-green-500">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {evaluation.improvements.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#f59e0b' }}>
            Improvements
          </p>
          <ul className="space-y-1">
            {evaluation.improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-amber-500">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {evaluation.tip && (
        <div
          className="p-3 rounded-xl text-sm select-text"
          style={{ backgroundColor: `${theme.button_color}15`, borderLeft: `3px solid ${theme.button_color}` }}
        >
          <span className="font-semibold">Tip: </span>
          {evaluation.tip}
        </div>
      )}

      {/* Confirmation dialog */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div
            className="p-6 rounded-3xl w-full max-w-xs text-center"
            style={{ backgroundColor: theme.secondary_bg_color, color: theme.text_color }}
          >
            <p className="text-lg font-bold mb-2">Exit Interview?</p>
            <p className="text-sm mb-6" style={{ color: theme.hint_color }}>
              You can continue this interview later from your profile.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-2xl font-medium text-sm transition-all active:scale-95"
                style={{ backgroundColor: `${theme.hint_color}33`, color: theme.text_color }}
              >
                Cancel
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="flex-1 py-3 rounded-2xl font-medium text-sm transition-all active:scale-95"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="flex-1 py-4 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95"
          style={{ backgroundColor: '#ef4444', color: 'white' }}
        >
          Exit
        </button>
        <button
          onClick={onNext}
          className="flex-[2] py-4 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95"
          style={{
            backgroundColor: theme.button_color,
            color: theme.button_text_color,
          }}
        >
          {isLast ? 'View Summary' : 'Next Question'}
        </button>
      </div>
    </div>
  );
}
