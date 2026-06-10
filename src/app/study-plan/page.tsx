'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTheme } from '@/lib/telegram';
import { useAuth } from '@/components/TelegramProvider';
import { getProfile } from '@/lib/api';
import {
  getSessionsForPlan,
  generateStudyPlan,
  getStudyPlans,
  getStudyPlanDetail,
  updateStudyPlanStatus,
  toggleStudyPlanDay,
} from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import type { ProfileData, StudyPlanSummary, StudyPlanDetail, StudyPlanDay } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';

// ── Helpers ─────────────────────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return '#64748b';
  if (score >= 7) return '#22c55e';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function planAccent(status: string): string {
  switch (status) {
    case 'active': return '#22c55e';
    case 'paused': return '#f59e0b';
    case 'completed': return '#3b82f6';
    default: return '#64748b';
  }
}

const DURATIONS = [3, 5, 7, 14, 30];
const MODES = [
  { value: '', labelKey: 'study_plan.filter_all' },
  { value: 'technical', labelKey: 'study_plan.filter_technical' },
  { value: 'behavioral', labelKey: 'study_plan.filter_behavioral' },
];

// ── Page ────────────────────────────────────────────────────────────────────────

export default function StudyPlanPage() {
  const theme = getTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { t, uiLang } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Plans
  const [plans, setPlans] = useState<StudyPlanSummary[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlanDetail | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);

  // Create form
  const [formMode, setFormMode] = useState('');
  const [formDateFrom, setFormDateFrom] = useState('');
  const [formDateTo, setFormDateTo] = useState('');
  const [formDuration, setFormDuration] = useState(7);
  const [sessionsCount, setSessionsCount] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Toggle day
  const [togglingDay, setTogglingDay] = useState<number | null>(null);

  const isPaid = profile && profile.plan_name !== 'Free';

  // Load profile + plans
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getProfile();
      setProfile(p);
      if (p.plan_name !== 'Free') {
        const plansRes = await getStudyPlans();
        setPlans(plansRes.plans);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('study_plan.error_load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Refresh plans list
  async function refreshPlans() {
    setPlansLoading(true);
    try {
      const res = await getStudyPlans();
      setPlans(res.plans);
    } catch { /* ignore */ }
    setPlansLoading(false);
  }

  // Select a plan
  async function handleSelectPlan(planId: number) {
    setSelectedPlan(null);
    try {
      const res = await getStudyPlanDetail(planId);
      setSelectedPlan(res.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
    }
  }

  // Fetch sessions count
  async function fetchSessionsCount() {
    setSessionError(null);
    try {
      const res = await getSessionsForPlan(
        formMode || undefined,
        formDateFrom || undefined,
        formDateTo || undefined,
      );
      setSessionsCount(res.sessions.length);
    } catch {
      setSessionError('Failed to check sessions');
      setSessionsCount(null);
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchSessionsCount, 500);
    return () => clearTimeout(timer);
  }, [formMode, formDateFrom, formDateTo]);

  // Generate plan
  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await generateStudyPlan(
        formMode || undefined,
        formDateFrom || undefined,
        formDateTo || undefined,
        formDuration,
        uiLang,
      );
      // Refresh list and select new plan
      await refreshPlans();
      if (res.plan?.id) {
        await handleSelectPlan(res.plan.id);
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : t('study_plan.error_generate'));
    } finally {
      setGenerating(false);
    }
  }

  // Toggle day
  async function handleToggleDay(dayId: number) {
    if (!selectedPlan) return;
    setTogglingDay(dayId);
    try {
      await toggleStudyPlanDay(selectedPlan.id, dayId);
      // Reload plan
      const res = await getStudyPlanDetail(selectedPlan.id);
      setSelectedPlan(res.plan);
    } catch { /* ignore */ }
    setTogglingDay(null);
  }

  // Update plan status
  async function handleUpdateStatus(status: string) {
    if (!selectedPlan) return;
    try {
      await updateStudyPlanStatus(selectedPlan.id, status);
      const res = await getStudyPlanDetail(selectedPlan.id);
      setSelectedPlan(res.plan);
      await refreshPlans();
    } catch { /* ignore */ }
  }

  // ── Loading ───────────────────────────────────────────────────────────────────

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
          onClick={fetchAll}
          className="px-6 py-3 rounded-2xl font-medium text-sm"
          style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
        >
          {t('study_plan.retry')}
        </button>
      </div>
    );
  }

  // ── Free plan — show upgrade screen ──────────────────────────────────────────

  if (!isPaid) {
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
            <h1 className="text-xl font-bold">{t('study_plan.title')}</h1>
            <div className="w-10" />
          </div>

          {/* Premium lock */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-xl font-bold mb-3">{t('study_plan.premium_title')}</h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: theme.hint_color }}>
              {t('study_plan.premium_desc')}
            </p>
            <button
              onClick={() => router.push('/subscriptions')}
              className="px-8 py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
              style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
            >
              {t('study_plan.upgrade')}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Plan detail view ─────────────────────────────────────────────────────────

  if (selectedPlan) {
    const accent = planAccent(selectedPlan.status);
    return (
      <>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div
          className="min-h-screen flex flex-col px-4 py-6 max-w-sm mx-auto"
          style={{ backgroundColor: theme.bg_color, color: theme.text_color }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { setSelectedPlan(null); refreshPlans(); }}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ backgroundColor: theme.secondary_bg_color }}
            >
              {t('study_plan.back')}
            </button>
            <h1 className="text-lg font-bold truncate ml-2">{selectedPlan.title}</h1>
            <div className="w-10" />
          </div>

          {/* Status badge */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${accent}20`, color: accent }}
            >
              {t(`study_plan.status_${selectedPlan.status}`)}
            </span>
            <span className="text-xs" style={{ color: theme.hint_color }}>
              {t('study_plan.days_completed', { done: selectedPlan.completed_days, total: selectedPlan.duration_days })}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full mb-4" style={{ backgroundColor: `${theme.hint_color}20` }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${selectedPlan.progress_percent}%`, backgroundColor: accent }}
            />
          </div>

          {/* Description */}
          {selectedPlan.description && (
            <p className="text-sm mb-4 leading-relaxed" style={{ color: theme.hint_color }}>
              {selectedPlan.description}
            </p>
          )}

          {/* Focus areas */}
          {selectedPlan.focus_areas.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.hint_color }}>
                {t('study_plan.focus_areas')}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedPlan.focus_areas.map((area, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: `${accent}15`, color: accent }}
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status controls */}
          {(selectedPlan.status === 'active' || selectedPlan.status === 'paused') && (
            <div className="flex gap-2 mb-4">
              {selectedPlan.status === 'active' && (
                <button
                  onClick={() => handleUpdateStatus('paused')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                  style={{ backgroundColor: `${theme.hint_color}20`, color: theme.text_color }}
                >
                  {t('study_plan.pause_plan')}
                </button>
              )}
              {selectedPlan.status === 'paused' && (
                <button
                  onClick={() => handleUpdateStatus('active')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  {t('study_plan.start_plan')}
                </button>
              )}
              <button
                onClick={() => handleUpdateStatus('completed')}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}
              >
                {t('study_plan.complete_plan')}
              </button>
            </div>
          )}

          {/* Days list */}
          <div className="flex-1 space-y-2 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.hint_color }}>
              {t('study_plan.my_plans')}
            </p>
            {selectedPlan.days.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                theme={theme}
                accent={accent}
                t={t}
                onToggle={handleToggleDay}
                toggling={togglingDay === day.id}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── Plans list + Create form ──────────────────────────────────────────────────

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
          <h1 className="text-xl font-bold">{t('study_plan.title')}</h1>
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

        {/* Create form */}
        <div className="mb-6 p-4 rounded-2xl" style={{ backgroundColor: theme.secondary_bg_color }}>
          <p className="text-sm font-semibold mb-4">{t('study_plan.create_title')}</p>

          {/* Mode filter */}
          <div className="mb-3">
            <p className="text-xs font-medium mb-2" style={{ color: theme.hint_color }}>
              {t('study_plan.filter_mode')}
            </p>
            <div className="flex gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setFormMode(m.value)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
                  style={{
                    backgroundColor: formMode === m.value ? theme.button_color : `${theme.hint_color}15`,
                    color: formMode === m.value ? theme.button_text_color : theme.text_color,
                  }}
                >
                  {t(m.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: theme.hint_color }}>
                {t('study_plan.filter_date_from')}
              </p>
              <input
                type="date"
                value={formDateFrom}
                onChange={(e) => setFormDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs"
                style={{
                  backgroundColor: `${theme.hint_color}10`,
                  color: theme.text_color,
                  border: `1px solid ${theme.hint_color}20`,
                }}
              />
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: theme.hint_color }}>
                {t('study_plan.filter_date_to')}
              </p>
              <input
                type="date"
                value={formDateTo}
                onChange={(e) => setFormDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs"
                style={{
                  backgroundColor: `${theme.hint_color}10`,
                  color: theme.text_color,
                  border: `1px solid ${theme.hint_color}20`,
                }}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="mb-3">
            <p className="text-xs font-medium mb-2" style={{ color: theme.hint_color }}>
              {t('study_plan.duration')}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setFormDuration(d)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                  style={{
                    backgroundColor: formDuration === d ? theme.button_color : `${theme.hint_color}15`,
                    color: formDuration === d ? theme.button_text_color : theme.text_color,
                  }}
                >
                  {t(`study_plan.duration_${d}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Session count + generate */}
          <div className="flex items-center justify-between">
            <div>
              {sessionsCount !== null && (
                <span className="text-xs" style={{ color: theme.hint_color }}>
                  {t('study_plan.sessions_found', { count: sessionsCount, s: sessionsCount !== 1 ? 's' : '' })}
                </span>
              )}
              {sessionError && (
                <span className="text-xs" style={{ color: '#ef4444' }}>{sessionError}</span>
              )}
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating || sessionsCount === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" color={theme.button_text_color} />
                  {t('study_plan.generating')}
                </span>
              ) : (
                t('study_plan.generate')
              )}
            </button>
          </div>

          {generateError && (
            <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{generateError}</p>
          )}
        </div>

        {/* Plans list */}
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.hint_color }}>
            {t('study_plan.my_plans')}
          </p>

          {plans.length === 0 && !plansLoading ? (
            <div
              className="p-8 rounded-2xl text-center"
              style={{ backgroundColor: theme.secondary_bg_color }}
            >
              <p className="text-4xl mb-3">📚</p>
              <p className="text-sm" style={{ color: theme.hint_color }}>
                {t('study_plan.no_plans')}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {plansLoading && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" color={theme.hint_color} />
                </div>
              )}
              {plans.map((plan) => {
                const accent = planAccent(plan.status);
                return (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all active:scale-98"
                    style={{ backgroundColor: theme.secondary_bg_color }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold truncate" style={{ color: theme.text_color }}>
                          {plan.title}
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0"
                          style={{ backgroundColor: `${accent}20`, color: accent }}
                        >
                          {t(`study_plan.status_${plan.status}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: theme.hint_color }}>
                          {plan.completed_days}/{plan.duration_days} {t('study_plan.duration_3').split(' ')[1]}
                        </span>
                        <span className="text-xs" style={{ color: theme.hint_color }}>
                          {formatDate(plan.created_at)}
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-full h-1.5 rounded-full mt-2" style={{ backgroundColor: `${theme.hint_color}15` }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${plan.progress_percent}%`, backgroundColor: accent }}
                        />
                      </div>
                    </div>
                    <span className="ml-3 text-lg" style={{ color: theme.hint_color }}>›</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Day Card ─────────────────────────────────────────────────────────────────────

function DayCard({
  day,
  theme,
  accent,
  t,
  onToggle,
  toggling,
}: {
  day: StudyPlanDay;
  theme: ReturnType<typeof getTheme>;
  accent: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  onToggle: (dayId: number) => void;
  toggling: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        backgroundColor: day.is_completed ? `${accent}08` : theme.secondary_bg_color,
        border: `1px solid ${day.is_completed ? `${accent}20` : 'transparent'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center p-4">
        {/* Check circle */}
        <button
          onClick={() => onToggle(day.id)}
          disabled={toggling}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-3 transition-all active:scale-90"
          style={{
            backgroundColor: day.is_completed ? accent : `${theme.hint_color}15`,
            color: day.is_completed ? '#ffffff' : theme.hint_color,
          }}
        >
          {toggling ? (
            <LoadingSpinner size="sm" color={theme.hint_color} />
          ) : day.is_completed ? (
            '✓'
          ) : (
            <span className="text-xs">{day.day_number}</span>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
          <p
            className="text-sm font-medium"
            style={{
              color: day.is_completed ? theme.hint_color : theme.text_color,
              textDecoration: day.is_completed ? 'line-through' : 'none',
            }}
          >
            {t('study_plan.day', { num: day.day_number })}: {day.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {day.estimated_minutes && (
              <span className="text-[10px]" style={{ color: theme.hint_color }}>
                {t('study_plan.estimated', { min: day.estimated_minutes })}
              </span>
            )}
            {day.resources.length > 0 && (
              <span className="text-[10px]" style={{ color: theme.hint_color }}>
                📎 {day.resources.length}
              </span>
            )}
          </div>
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 w-6 h-6 flex items-center justify-center text-xs transition-transform"
          style={{ color: theme.hint_color, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          {day.description && (
            <p className="text-xs mb-3 leading-relaxed" style={{ color: theme.hint_color }}>
              {day.description}
            </p>
          )}
          {day.resources.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: theme.hint_color }}>
                {t('study_plan.resources')}
              </p>
              <div className="space-y-1.5">
                {day.resources.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all active:scale-95"
                    style={{
                      backgroundColor: `${theme.hint_color}10`,
                      color: theme.button_color,
                    }}
                  >
                    <span>
                      {r.type === 'youtube' ? '▶️' : r.type === 'leetcode' ? '💻' : r.type === 'book' ? '📖' : '🔗'}
                    </span>
                    <span className="flex-1 truncate">{r.title}</span>
                    <span className="text-[10px] opacity-60 shrink-0">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Complete button */}
          <button
            onClick={() => onToggle(day.id)}
            disabled={toggling}
            className="w-full mt-3 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor: day.is_completed ? `${theme.hint_color}15` : accent,
              color: day.is_completed ? theme.hint_color : '#ffffff',
            }}
          >
            {toggling ? (
              <LoadingSpinner size="sm" color="#ffffff" />
            ) : day.is_completed ? (
              <>{t('study_plan.toggle_undo')}</>
            ) : (
              <>{t('study_plan.toggle_done')}</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
