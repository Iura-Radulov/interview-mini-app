'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTheme } from '@/lib/telegram';
import { useAuth } from '@/components/TelegramProvider';
import { getProfile, startSystemDesign, getCompanies } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import type { CompanyInfo } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';

const LEVELS = ['Junior', 'Mid', 'Senior'];
const PROBLEM_COUNT = 6;

export default function SystemDesignPage() {
  const theme = getTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { t, uiLang } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [planName, setPlanName] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  const [selectedProblem, setSelectedProblem] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('general');
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => setPlanName(p.plan_name))
      .catch(() => setPlanName('Free'))
      .finally(() => setPlanLoading(false));

    getCompanies()
      .then((data) => setCompanies(data.companies || []))
      .catch(() => {});
  }, []);

  async function handleStart() {
    if (!selectedLevel) return;
    setStarting(true);
    setStartError(null);
    try {
      const problemName = selectedProblem !== null ? t(`sd.problem.${selectedProblem}`) : 'General System Design';
      const result = await startSystemDesign(problemName, selectedLevel, selectedCompany);
      sessionStorage.setItem(`sd_${result.session_id}_problem`, problemName);
      sessionStorage.setItem(`sd_${result.session_id}_level`, selectedLevel);
      router.push(`/system-design/interview?session=${result.session_id}`);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Failed to start.');
      setStarting(false);
    }
  }

  if (planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg_color }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isFree = planName === 'Free';

  if (isFree) {
    return (
      <>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div
          className="min-h-screen flex flex-col items-center justify-center p-8 max-w-sm mx-auto"
          style={{ backgroundColor: theme.bg_color, color: theme.text_color }}
        >
          <div className="text-6xl mb-5">🏗️</div>
          <h2 className="text-xl font-bold mb-2 text-center">{t('sd.premium_title')}</h2>
          <p className="text-sm text-center mb-6" style={{ color: theme.hint_color }}>
            {t('sd.premium_desc')}
          </p>
          <button
            onClick={() => router.push('/subscriptions')}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 mb-4"
            style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
          >
            {t('sd.upgrade')}
          </button>
          <button
            onClick={() => router.push('/')}
            className="text-sm transition-all active:scale-95"
            style={{ color: theme.hint_color }}
          >
            {t('sd.back')}
          </button>
        </div>
      </>
    );
  }

  const canStart = selectedLevel !== null;

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
          <h1 className="text-xl font-bold">{t('sd.title')}</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm transition-all active:scale-95"
            style={{ color: theme.hint_color }}
          >
            {t('sd.back')}
          </button>
        </div>

        {/* Header card */}
        <div
          className="p-5 rounded-2xl mb-5 text-center"
          style={{ backgroundColor: theme.secondary_bg_color }}
        >
          <div className="text-4xl mb-2">🏗️</div>
          <p className="text-sm" style={{ color: theme.hint_color }}>{t('sd.desc')}</p>
        </div>

        {/* Problem selection */}
        <p className="text-sm font-semibold mb-3">{t('sd.select_problem')}</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {Array.from({ length: PROBLEM_COUNT }, (_, i) => (
            <button
              key={i}
              onClick={() => setSelectedProblem(selectedProblem === i ? null : i)}
              className="p-3 rounded-2xl text-xs font-medium text-left transition-all active:scale-95"
              style={{
                backgroundColor: selectedProblem === i ? `${theme.button_color}20` : theme.secondary_bg_color,
                color: selectedProblem === i ? theme.button_color : theme.text_color,
                border: `2px solid ${selectedProblem === i ? theme.button_color : 'transparent'}`,
              }}
            >
              {t(`sd.problem.${i}`)}
            </button>
          ))}
        </div>

        {/* Level selection */}
        <p className="text-sm font-semibold mb-3">{t('setup.select_level')}</p>
        <div className="flex gap-2 mb-5">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
              style={{
                backgroundColor: selectedLevel === level ? theme.button_color : theme.secondary_bg_color,
                color: selectedLevel === level ? theme.button_text_color : theme.text_color,
              }}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Company selection */}
        {companies.length > 0 && (
          <>
            <p className="text-sm font-semibold mb-3">{t('setup.select_role')}</p>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full p-4 rounded-2xl text-sm border-2 outline-none appearance-none mb-5"
              style={{
                backgroundColor: theme.secondary_bg_color,
                color: theme.text_color,
                borderColor: selectedCompany !== 'general' ? theme.button_color : `${theme.hint_color}44`,
              }}
            >
              <option value="general" style={{ color: theme.hint_color }}>— General —</option>
              {companies
                .filter((c) => c.available)
                .map((c) => (
                  <option key={c.id} value={c.id} style={{ color: theme.text_color }}>
                    {c.emoji} {uiLang === 'ru' ? c.name_ru : c.name_en}
                  </option>
                ))}
            </select>
          </>
        )}

        {startError && (
          <p className="text-xs mb-3 text-center" style={{ color: '#ef4444' }}>{startError}</p>
        )}

        {/* Start button */}
        <div className="flex-1 flex flex-col justify-end pb-4">
          <button
            onClick={handleStart}
            disabled={!canStart || starting}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95 disabled:opacity-40"
            style={{
              backgroundColor: canStart && !starting ? theme.button_color : `${theme.hint_color}30`,
              color: canStart && !starting ? theme.button_text_color : theme.hint_color,
            }}
          >
            {starting ? t('sd.starting') : t('sd.start_interview')}
          </button>
        </div>
      </div>
    </>
  );
}
