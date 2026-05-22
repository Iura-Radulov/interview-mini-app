'use client';

import { useState, useRef, useEffect } from 'react';
import type { Question } from '@/types';
import { getTheme } from '@/lib/telegram';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  question: Question;
  onSubmit: (answer: string) => void;
  loading: boolean;
}

const MAX_CHARS = 2000;

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

export default function QuestionCard({ question, onSubmit, loading }: Props) {
  const theme = getTheme();
  const [answer, setAnswer] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setAnswer('');
    textareaRef.current?.focus();
  }, [question]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [answer]);

  function handleSubmit() {
    if (!answer.trim() || loading) return;
    onSubmit(answer.trim());
  }

  const diffColor = DIFFICULTY_COLORS[question.difficulty?.toLowerCase()] ?? '#2678b6';
  const remaining = MAX_CHARS - answer.length;
  const canSubmit = answer.trim().length > 0 && !loading;

  return (
    <div
      className="flex flex-col gap-4 px-4 py-4"
      style={{ color: theme.text_color }}
    >
      <div className="flex flex-wrap gap-2">
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: `${theme.button_color}20`, color: theme.button_color }}
        >
          {question.category}
        </span>
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
          style={{ backgroundColor: `${diffColor}20`, color: diffColor }}
        >
          {question.difficulty}
        </span>
      </div>

      <div
        className="p-4 rounded-2xl text-base leading-relaxed select-text"
        style={{ backgroundColor: theme.secondary_bg_color }}
      >
        {question.question}
      </div>

      <div>
        <textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Type your answer here…"
          rows={4}
          className="w-full rounded-2xl p-4 text-sm resize-none outline-none border-2 transition-colors focus:border-opacity-100 min-h-[120px]"
          style={{
            backgroundColor: theme.secondary_bg_color,
            color: theme.text_color,
            borderColor: answer.length > 0 ? theme.button_color : `${theme.hint_color}44`,
          }}
          disabled={loading}
        />
        <div
          className="text-right text-xs mt-1 pr-1"
          style={{ color: remaining < 100 ? '#ef4444' : theme.hint_color }}
        >
          {remaining} / {MAX_CHARS}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
        style={{
          backgroundColor: canSubmit ? theme.button_color : `${theme.hint_color}44`,
          color: canSubmit ? theme.button_text_color : theme.hint_color,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" color={theme.button_text_color} />
            <span>Evaluating…</span>
          </>
        ) : (
          'Submit Answer'
        )}
      </button>
    </div>
  );
}
