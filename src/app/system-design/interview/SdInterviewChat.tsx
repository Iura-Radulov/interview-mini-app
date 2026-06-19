'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTheme } from '@/lib/telegram';
import { useAuth } from '@/components/TelegramProvider';
import { submitSystemDesignStep, getSystemDesignSession } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';

interface ChatMsg {
  role: 'ai' | 'user';
  text: string;
  step?: number;
  step_name?: string;
  score?: number;
  feedback?: string;
  hints?: string[];
}

interface SdEval {
  requirements_clarity: number;
  estimations: number;
  data_model: number;
  api_design: number;
  architecture: number;
  deep_dive: number;
  trade_offs: number;
  overall: number;
  assessment: string;
  strengths: string[];
  improvements: string[];
  topics_to_study: string[];
}

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

export default function SdInterviewChat() {
  const theme = getTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<SdEval | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentStepName, setCurrentStepName] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sessionId = searchParams.get('session');

  // Load session — fresh start or resume
  useEffect(() => {
    async function init() {
      if (!sessionId) return;
      setLoading(true);
      try {
        // First check if session has existing context (resume scenario)
        const sessionData = await getSystemDesignSession(Number(sessionId));

        if (sessionData.step_context && sessionData.step_context.length > 0) {
          // Resume — restore messages from step_context
          const restoredMessages: ChatMsg[] = [];

          // For each completed step, add the prompt and answer
          for (const sc of sessionData.step_context) {
            if (sc.prompt) {
              restoredMessages.push({
                role: 'ai',
                text: sc.prompt,
                step: sc.step,
                step_name: sc.step_name,
                hints: [],
              });
            }
            if (sc.answer) {
              restoredMessages.push({
                role: 'user',
                text: sc.answer,
                step: sc.step,
                step_name: sc.step_name,
                score: sc.score,
                feedback: sc.feedback,
              });
            }
            // Show feedback after user answer
            if (sc.feedback) {
              restoredMessages.push({
                role: 'ai',
                text: `${t('sd.feedback', { score: String(sc.score) })}\n${sc.feedback}`,
                step: sc.step,
                score: sc.score,
                feedback: sc.feedback,
              });
            }
          }

          setMessages(restoredMessages);

          if (sessionData.completed) {
            // Session is complete — redirect to summary
            router.replace(`/system-design/summary?session=${sessionData.id}`);
            return;
          }

          // Set current step for the next unanswered prompt
          setCurrentStep(sessionData.current_step);

          // Get the next step prompt
          const stepName = [
            'Requirements Clarification', 'Estimations', 'Data Model',
            'API Design', 'Architecture', 'Deep Dive', 'Trade-offs',
          ][sessionData.current_step - 1] || `Step ${sessionData.current_step}`;
          setCurrentStepName(stepName);

          // Load next step (use submitSystemDesignStep with empty answer to advance)
          const res = await submitSystemDesignStep(Number(sessionId), '');
          setCurrentStep(res.step);
          setCurrentStepName(res.step_name || stepName);
          setHints(res.hints || []);
          setMessages((prev) => [...prev, {
            role: 'ai',
            text: res.prompt || '',
            step: res.step,
            step_name: res.step_name,
            hints: res.hints,
          }]);
        } else {
          // Fresh start — use existing init flow
          const res = await submitSystemDesignStep(Number(sessionId), '');
          setCurrentStep(res.step);
          setCurrentStepName(res.step_name || '');
          setHints(res.hints || []);
          setMessages([{
            role: 'ai',
            text: res.prompt || '',
            step: res.step,
            step_name: res.step_name,
            hints: res.hints,
          }]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [sessionId]);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !sessionId || submitting) return;
    const answer = input.trim();
    setInput('');
    setSubmitting(true);
    setError(null);

    // Add user message
    const userMsg: ChatMsg = {
      role: 'user',
      text: answer,
      step: currentStep,
      step_name: currentStepName,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await submitSystemDesignStep(Number(sessionId), answer);

      if (res.done && res.evaluation) {
        // Session complete — show evaluation
        setEvaluation(res.evaluation as SdEval);
        // Add score feedback
        setMessages((prev) => [...prev, {
          role: 'ai',
          text: res.feedback || '',
          step: currentStep,
          score: res.score,
          feedback: res.feedback,
        }]);
      } else if (res.prompt) {
        // Next step
        setCurrentStep(res.step);
        setCurrentStepName(res.step_name || '');
        setHints(res.hints || []);
        // Add score for previous step + next prompt
        setMessages((prev) => [...prev,
          {
            role: 'ai' as const,
            text: res.feedback || '',
            step: currentStep,
            score: res.score,
            feedback: res.feedback,
          },
          {
            role: 'ai' as const,
            text: res.prompt || '',
            step: res.step,
            step_name: res.step_name,
            hints: res.hints,
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sd.chat_error_submit'));
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg_color }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: theme.bg_color, color: theme.text_color }}>
        <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  // ── Final evaluation screen ──
  if (evaluation) {
    const comps = STEP_COMPONENTS.map((c) => ({
      ...c,
      score: (evaluation as any)[c.key] as number ?? 5,
    }));

    return (
      <>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="min-h-screen flex flex-col px-4 py-6 max-w-sm mx-auto" style={{ backgroundColor: theme.bg_color, color: theme.text_color }}>
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90" style={{ backgroundColor: theme.secondary_bg_color }}>☰</button>
            <h1 className="text-xl font-bold">{t('sd.evaluation_title')}</h1>
            <button onClick={() => router.push('/system-design')} className="text-sm transition-all active:scale-95" style={{ color: theme.hint_color }}>{t('sd.back')}</button>
          </div>

          {/* Overall score */}
          <div className="text-center mb-6 p-5 rounded-2xl" style={{ backgroundColor: theme.secondary_bg_color }}>
            <div className="text-4xl mb-2">🏗️</div>
            <p className="text-3xl font-bold" style={{ color: scoreBarColor(evaluation.overall) }}>{evaluation.overall.toFixed(1)}</p>
            <p className="text-xs" style={{ color: theme.hint_color }}>{t('sd.evaluation_overall', { score: evaluation.overall.toFixed(1) })}</p>
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
          {evaluation.assessment && (
            <div className="p-4 rounded-2xl mb-4 text-sm leading-relaxed" style={{ backgroundColor: theme.secondary_bg_color }}>
              <p>{evaluation.assessment}</p>
            </div>
          )}

          {/* Strengths */}
          {evaluation.strengths.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">{t('sd.strengths')}</p>
              <ul className="space-y-1">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-sm" style={{ color: theme.text_color }}>• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {evaluation.improvements.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2" style={{ color: '#f59e0b' }}>{t('sd.improvements')}</p>
              <ul className="space-y-1">
                {evaluation.improvements.map((s, i) => (
                  <li key={i} className="text-sm" style={{ color: theme.text_color }}>• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Topics to study */}
          {evaluation.topics_to_study.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold mb-2" style={{ color: theme.button_color }}>{t('sd.topics')}</p>
              <ul className="space-y-1">
                {evaluation.topics_to_study.map((s, i) => (
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
            <button onClick={() => router.push('/profile')} className="w-full py-3 rounded-2xl font-medium text-sm transition-all active:scale-95" style={{ backgroundColor: `${theme.button_color}12`, color: theme.button_color }}>
              {t('sd.view_profile')}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Chat view ──
  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.bg_color, color: theme.text_color }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${theme.hint_color}25` }}>
          <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90" style={{ backgroundColor: theme.secondary_bg_color }}>☰</button>
          <div className="text-center flex-1">
            <h1 className="text-sm font-bold">{t('sd.chat_title')}</h1>
            <p className="text-[10px] mt-0.5" style={{ color: theme.hint_color }}>
              {t('sd.step_of', { current: String(currentStep), total: '7' })} — {currentStepName}
            </p>
          </div>
          <button onClick={() => router.push('/system-design')} className="text-xs transition-all active:scale-95" style={{ color: theme.hint_color }}>{t('sd.back')}</button>
        </div>

        {/* Step progress bar */}
        <div className="flex px-4 py-2 gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full" style={{
              backgroundColor: s <= currentStep ? theme.button_color : `${theme.hint_color}20`,
            }} />
          ))}
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
              }`} style={{
                backgroundColor: msg.role === 'user' ? theme.button_color : theme.secondary_bg_color,
                color: msg.role === 'user' ? theme.button_text_color : theme.text_color,
              }}>
                {/* Step name badge */}
                {msg.step_name && msg.role === 'ai' && messages.filter(m => m.role === 'ai').indexOf(msg) === 0 && (
                  <div className="text-[10px] font-semibold mb-1 opacity-70">{msg.step_name}</div>
                )}
                <p>{msg.text}</p>
                {/* Score badge for user answers */}
                {msg.score != null && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: `${theme.hint_color}30` }}>
                    <span className="text-xs font-bold">{t('sd.feedback', { score: String(msg.score) })}</span>
                    {msg.feedback && <p className="text-xs mt-1 opacity-80">{msg.feedback}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Hints */}
          {hints.length > 0 && messages.length > 0 && messages[messages.length - 1].role === 'ai' && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-3 rounded-2xl text-xs" style={{ backgroundColor: `${theme.hint_color}12`, color: theme.hint_color }}>
                <p className="font-semibold mb-1">💡 {t('setup.skills_label')}</p>
                <ul className="space-y-0.5">
                  {hints.map((h, i) => <li key={i}>• {h}</li>)}
                </ul>
              </div>
            </div>
          )}

          {submitting && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-3 rounded-2xl text-sm" style={{ backgroundColor: theme.secondary_bg_color }}>
                <LoadingSpinner size="sm" color={theme.hint_color} />
                <span className="text-xs ml-2" style={{ color: theme.hint_color }}>{t('sd.chat_thinking')}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center">
              <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t flex items-end gap-2" style={{ borderColor: `${theme.hint_color}25`, backgroundColor: theme.secondary_bg_color }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('sd.chat_input_placeholder')}
            rows={1}
            disabled={submitting}
            className="flex-1 rounded-2xl px-4 py-3 text-sm resize-none outline-none border-2 transition-colors"
            style={{
              backgroundColor: theme.bg_color,
              color: theme.text_color,
              borderColor: input ? theme.button_color : `${theme.hint_color}30`,
              maxHeight: 120,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || submitting}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 transition-all active:scale-90 disabled:opacity-40"
            style={{ backgroundColor: input.trim() && !submitting ? theme.button_color : `${theme.hint_color}25`, color: input.trim() && !submitting ? theme.button_text_color : theme.hint_color }}
          >
            {submitting ? <LoadingSpinner size="sm" color={theme.hint_color} /> : '➤'}
          </button>
        </div>
      </div>
    </>
  );
}
