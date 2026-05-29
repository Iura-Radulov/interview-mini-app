'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Question, Evaluation, AnswerItem, InterviewMode } from '@/types';
import { getNextQuestion, submitAnswer, voiceAnswer } from '@/lib/api';
import { getTheme } from '@/lib/telegram';
import { useTranslation } from '@/lib/i18n';
import ProgressBar from '@/components/ProgressBar';
import QuestionCard from '@/components/QuestionCard';
import EvaluationCard from '@/components/EvaluationCard';
import LoadingSpinner from '@/components/LoadingSpinner';

const TOTAL_QUESTIONS = 5;

type Phase = 'question' | 'evaluation';

export default function InterviewFlow() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = getTheme();

  const sessionId = Number(searchParams.get('session') ?? '0');
  const initialQ = Number(searchParams.get('q') ?? '1');

  const [question, setQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(initialQ);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [phase, setPhase] = useState<Phase>('question');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [mode, setMode] = useState<InterviewMode>('technical');

  // Detect mode from cached question or session-level storage
  useEffect(() => {
    const modeKey = `interview_${sessionId}_mode`;
    const storedMode = sessionStorage.getItem(modeKey);
    if (storedMode === 'technical' || storedMode === 'behavioral') {
      setMode(storedMode);
      return;
    }
    // Fallback: check question-level mode (legacy)
    const key = `interview_${sessionId}_q${initialQ}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      try {
        const q = JSON.parse(stored);
        if (q && q.mode) {
          setMode(q.mode);
        }
      } catch {
        // ignore
      }
    }
  }, [sessionId, initialQ]);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/');
      return;
    }
    const key = `interview_${sessionId}_q${initialQ}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      try {
        setQuestion(JSON.parse(stored));
        return;
      } catch {
        // ignore
      }
    }
    // Not in cache — fetch from API (resuming incomplete session)
    setLoading(true);
    getNextQuestion(sessionId)
      .then((res) => {
        setQuestion(res.question);
        setQuestionNumber(res.question_number);
        sessionStorage.setItem(
          `interview_${sessionId}_q${res.question_number}`,
          JSON.stringify(res.question)
        );
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('interview.load_error'));
      })
      .finally(() => setLoading(false));
  }, [sessionId, initialQ, router]);

  const handleSubmitAnswer = useCallback(
    async (answer: string, timeTakenSeconds?: number) => {
      if (!question || !sessionId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await submitAnswer(sessionId, answer, question.question, timeTakenSeconds);
        const answerItem: AnswerItem = {
          question,
          answer,
          evaluation: result.evaluation,
          question_number: questionNumber,
        };
        const updatedAnswers = [...answers, answerItem];
        setAnswers(updatedAnswers);
        setEvaluation(result.evaluation);
        setPhase('evaluation');

        if (result.done) {
          sessionStorage.setItem(
            `summary_${sessionId}`,
            JSON.stringify({ summary: result.summary, answers: updatedAnswers })
          );
        } else if (result.next_question && result.question_number) {
          sessionStorage.setItem(
            `interview_${sessionId}_q${result.question_number}`,
            JSON.stringify(result.next_question)
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('interview.submit_error'));
      } finally {
        setLoading(false);
      }
    },
    [question, sessionId, questionNumber, answers]
  );

  const handleVoiceSubmit = useCallback(
    async (audioBlob: Blob, timeTakenSeconds?: number) => {
      if (!question || !sessionId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await voiceAnswer(sessionId, question.question, audioBlob, timeTakenSeconds);
        const transcribed = result.transcribed || '…';
        const answerItem: AnswerItem = {
          question,
          answer: transcribed,
          evaluation: result.evaluation,
          question_number: questionNumber,
        };
        const updatedAnswers = [...answers, answerItem];
        setAnswers(updatedAnswers);
        setEvaluation(result.evaluation);
        setPhase('evaluation');

        if (result.done) {
          sessionStorage.setItem(
            `summary_${sessionId}`,
            JSON.stringify({ summary: result.summary, answers: updatedAnswers })
          );
        } else if (result.next_question && result.question_number) {
          sessionStorage.setItem(
            `interview_${sessionId}_q${result.question_number}`,
            JSON.stringify(result.next_question)
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('interview.submit_error'));
      } finally {
        setLoading(false);
      }
    },
    [question, sessionId, questionNumber, answers]
  );

  function handleNext() {
    const isLast = questionNumber >= TOTAL_QUESTIONS;
    if (isLast) {
      router.push(`/summary?session=${sessionId}`);
      return;
    }
    const nextNum = questionNumber + 1;
    const nextKey = `interview_${sessionId}_q${nextNum}`;
    const stored = sessionStorage.getItem(nextKey);
    if (stored) {
      try {
        setQuestion(JSON.parse(stored));
        setQuestionNumber(nextNum);
        setEvaluation(null);
        setPhase('question');
        router.replace(`/interview?session=${sessionId}&q=${nextNum}`, { scroll: false });
        return;
      } catch {
        // fallback
      }
    }
    setError(t('interview.next_error'));
  }

  if (!sessionId) return null;

  if (!question && loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.bg_color }}
      >
        <LoadingSpinner size="lg" color={theme.button_color} />
      </div>
    );
  }

  if (!question && error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 gap-4"
        style={{ backgroundColor: theme.bg_color, color: theme.text_color }}
      >
        <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={() => router.push('/profile')}
          className="px-6 py-3 rounded-2xl font-medium text-sm"
          style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
        >
          {t('interview.go_profile')}
        </button>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div
      className="min-h-screen flex flex-col max-w-sm mx-auto"
      style={{ backgroundColor: theme.bg_color }}
    >
      <ProgressBar
        current={questionNumber}
        total={TOTAL_QUESTIONS}
        buttonColor={theme.button_color}
        textColor={theme.text_color}
        hintColor={theme.hint_color}
        mode={mode}
      />

      {error && (
        <div
          className="mx-4 mb-2 p-3 rounded-xl text-sm text-center"
          style={{ backgroundColor: '#ff444420', color: '#ef4444' }}
        >
          {error}
        </div>
      )}

      <div className="flex-1">
        {phase === 'question' && (
          <QuestionCard
            question={question}
            onSubmit={handleSubmitAnswer}
            onVoiceSubmit={handleVoiceSubmit}
            loading={loading}
            mode={mode}
          />
        )}
        {phase === 'evaluation' && evaluation && (
          <EvaluationCard
            evaluation={evaluation}
            isLast={questionNumber >= TOTAL_QUESTIONS}
            onNext={handleNext}
            mode={mode}
          />
        )}
      </div>
    </div>
  );
}
