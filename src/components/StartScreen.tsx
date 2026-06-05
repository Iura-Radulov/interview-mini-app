'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTheme } from '@/lib/telegram';
import { useAuth } from '@/components/TelegramProvider';
import { startInterview, uploadResume, getRoles, getCompanies, getProfile } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import type { ResumeAnalysis, RoleInfo, CompanyInfo, InterviewMode } from '@/types';
import LoadingSpinner from './LoadingSpinner';
import Sidebar from './Sidebar';

const LEVELS = ['Junior', 'Mid', 'Senior'];

// ── Styles for the mode toggle ─────────────────────────────────────────────────

const MODE_TOGGLE_STYLES = `
.mode-toggle {
  display: flex;
  background: var(--mode-bg, #f0f0f0);
  border-radius: 16px;
  padding: 4px;
  gap: 4px;
  margin-bottom: 20px;
}
.mode-toggle-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  border-radius: 13px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
}
.mode-toggle-btn.active {
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}
`;

export default function StartScreen() {
  const router = useRouter();
  const theme = getTheme();
  const { user } = useAuth();
  const { t, uiLang } = useTranslation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<InterviewMode>('technical');
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('general');
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rolesLoading, setRolesLoading] = useState(true);

  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [planName, setPlanName] = useState<string>('Free');
  const [totalCompleted, setTotalCompleted] = useState<number>(0);
  const [maxPerMonth, setMaxPerMonth] = useState<number>(2);
  const [skills, setSkills] = useState<string>('');

  // Reset selections when mode changes
  useEffect(() => {
    setSelectedRole(null);
    setSelectedLevel(null);
    setError(null);
  }, [mode]);

  // Load roles, companies, and profile from API
  useEffect(() => {
    getRoles()
      .then((data) => setRoles(data.roles || []))
      .catch(() => setError('Failed to load roles'))
      .finally(() => setRolesLoading(false));
    getCompanies()
      .then((data) => setCompanies(data.companies || []))
      .catch(() => {});  // non-critical
    // Check user's plan for behavioral access
    getProfile()
      .then((p) => {
        setPlanName(p.plan_name);
        setTotalCompleted(p.total_completed);
        setMaxPerMonth(p.max_per_month);
      })
      .catch(() => {});  // non-critical, default Free
  }, []);

  const primaryRoles = roles.filter((r) => r.is_primary && r.available);
  const otherRoles = roles.filter((r) => !r.is_primary && r.available);

  // Label for selected role (respects UI language)
  const roleLabel = (r: RoleInfo): string => {
    const name = uiLang === 'ru' ? r.name_ru : r.name_en;
    return r.emoji ? `${r.emoji} ${name}` : name;
  };

  async function startInterviewWith(role: string, level: string, companyId?: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await startInterview(role, level, companyId, mode, skills || undefined);
      sessionStorage.setItem(
        `interview_${result.session_id}_q1`,
        JSON.stringify(result.question)
      );
      sessionStorage.setItem(
        `interview_${result.session_id}_mode`,
        result.mode
      );
      router.push(`/interview?session=${result.session_id}&q=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setup.failed_start'));
      setLoading(false);
    }
  }

  async function handleStart() {
    if (!selectedRole || !selectedLevel) return;
    await startInterviewWith(selectedRole, selectedLevel, selectedCompany);
  }

  async function handleStartFromResume() {
    if (!resumeAnalysis) return;
    const role = resumeAnalysis.suggested_role;
    const level = resumeAnalysis.suggested_level;
    if (!role || !level) {
      setError(t('setup.failed_parse'));
      return;
    }
    setSelectedRole(role);
    setSelectedLevel(level);
    await startInterviewWith(role, level);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeLoading(true);
    setError(null);

    try {
      const analysis = await uploadResume(file);
      setResumeAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setup.failed_upload'));
    } finally {
      setResumeLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const isFree = planName === 'Free';
  const isLimitReached = isFree && totalCompleted >= maxPerMonth;
  const canStart = !!selectedRole && !!selectedLevel && !loading && !isLimitReached;
  const isBehavioralLocked = isFree; // Behavioral доступен только Pro/Premium

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
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90"
            style={{ backgroundColor: theme.secondary_bg_color }}
            aria-label="Open menu"
          >
            ☰
          </button>
          <button
            onClick={() => router.push('/')}
            className="text-sm flex items-center gap-1 active:scale-95 transition-all"
            style={{ color: theme.button_color }}
          >
            {t('setup.back_dashboard')}
          </button>
        </div>

        <div className="flex-1">
          <div className="text-center mb-8 mt-2">
            <div className="text-5xl mb-3">🎯</div>
            <h1 className="text-2xl font-bold mb-1">{t('setup.title')}</h1>
            <p className="text-sm" style={{ color: theme.hint_color }}>
              {t('setup.subtitle')}
            </p>
          </div>

          {rolesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Mode selector — Technical vs Behavioral */}
              <style>{MODE_TOGGLE_STYLES}</style>
              <div
                className="mode-toggle"
                style={{ '--mode-bg': theme.secondary_bg_color } as React.CSSProperties}
              >
                <button
                  className={`mode-toggle-btn${mode === 'technical' ? ' active' : ''}`}
                  onClick={() => setMode('technical')}
                  style={mode === 'technical' ? { background: theme.bg_color, color: theme.text_color } : { color: theme.hint_color }}
                >
                  <span>💻</span>
                  <span>{t('behavioral.mode_technical')}</span>
                </button>
                <button
                  className={`mode-toggle-btn${mode === 'behavioral' ? ' active' : ''}`}
                  onClick={() => {
                    if (isBehavioralLocked) {
                      setError(t('behavioral.premium_only'));
                    } else {
                      setMode('behavioral');
                    }
                  }}
                  style={mode === 'behavioral'
                    ? { background: theme.bg_color, color: theme.text_color }
                    : {
                        color: isBehavioralLocked ? `${theme.hint_color}70` : theme.hint_color,
                        cursor: isBehavioralLocked ? 'not-allowed' : 'pointer',
                      }
                  }
                >
                  <span>{isBehavioralLocked ? '🔒' : '🎭'}</span>
                  <span>{t('behavioral.mode_behavioral')}</span>
                  {isBehavioralLocked && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1"
                      style={{ backgroundColor: `${theme.hint_color}30`, color: theme.hint_color }}>
                      Pro
                    </span>
                  )}
                </button>
              </div>

              {/* Primary roles — buttons */}
              <div className="mb-4">
                <p className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: theme.hint_color }}>
                  {t('setup.select_role')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {primaryRoles.map((role) => {
                    const isSelected = selectedRole === role.name_en;
                    return (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.name_en)}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95"
                        style={{
                          borderColor: isSelected ? theme.button_color : `${theme.hint_color}44`,
                          backgroundColor: isSelected ? `${theme.button_color}15` : theme.secondary_bg_color,
                          color: isSelected ? theme.button_color : theme.text_color,
                        }}
                      >
                        <span className="text-2xl mb-1">{role.emoji}</span>
                        <span className="text-sm font-medium">
                          {uiLang === 'ru' ? role.name_ru : role.name_en}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Other roles — select dropdown */}
              {otherRoles.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: theme.hint_color }}>
                    {t('setup.other_roles')}
                  </p>
                  <select
                    value={selectedRole || ''}
                    onChange={(e) => setSelectedRole(e.target.value || null)}
                    className="w-full p-4 rounded-2xl text-sm border-2 outline-none appearance-none"
                    style={{
                      backgroundColor: theme.secondary_bg_color,
                      color: theme.text_color,
                      borderColor: selectedRole && !primaryRoles.find(r => r.name_en === selectedRole)
                        ? theme.button_color
                        : `${theme.hint_color}44`,
                    }}
                  >
                    <option value="" style={{ color: theme.hint_color }}>
                      {uiLang === 'ru' ? 'Выберите дополнительную роль...' : 'Select additional role...'}
                    </option>
                    {otherRoles.map((role) => (
                      <option key={role.id} value={role.name_en} style={{ color: theme.text_color }}>
                        {roleLabel(role)}
                      </option>
                    ))}
                  </select>

                  {/* Skills input */}
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: theme.hint_color }}>
                      {t('setup.skills_label')}
                    </p>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder={t('setup.skills_placeholder')}
                      className="w-full p-4 rounded-2xl text-sm border-2 outline-none"
                      style={{
                        backgroundColor: theme.secondary_bg_color,
                        color: theme.text_color,
                        borderColor: skills ? theme.button_color : `${theme.hint_color}44`,
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Level selection */}
          <div className="mb-8">
            <p className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: theme.hint_color }}>
              {t('setup.select_level')}
            </p>
            <div className="flex gap-3">
              {LEVELS.map((level) => {
                const isSelected = selectedLevel === level;
                return (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className="flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 active:scale-95"
                    style={{
                      borderColor: isSelected ? theme.button_color : `${theme.hint_color}44`,
                      backgroundColor: isSelected ? theme.button_color : 'transparent',
                      color: isSelected ? theme.button_text_color : theme.text_color,
                    }}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company selection */}
          <div className="mb-6">
            <p className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: theme.hint_color }}>
              {uiLang === 'ru' ? 'КОМПАНИЯ' : 'COMPANY'}
            </p>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full p-4 rounded-2xl text-sm border-2 outline-none appearance-none"
              style={{
                backgroundColor: theme.secondary_bg_color,
                color: theme.text_color,
                borderColor: selectedCompany !== 'general'
                  ? theme.button_color
                  : `${theme.hint_color}44`,
              }}
            >
              {companies
                .filter((c) => c.available)
                .map((c) => (
                  <option key={c.id} value={c.id} style={{ color: theme.text_color }}>
                    {c.emoji} {uiLang === 'ru' ? c.name_ru : c.name_en}
                  </option>
                ))}
            </select>
            {selectedCompany !== 'general' && (
              <p className="text-xs mt-2" style={{ color: theme.hint_color }}>
                {uiLang === 'ru'
                  ? 'Вопросы будут адаптированы под собеседование в этой компании'
                  : 'Questions will be tailored to this company\'s interview process'}
              </p>
            )}
          </div>

          {/* Resume divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: `${theme.hint_color}44` }} />
            <span className="text-xs uppercase tracking-wide" style={{ color: theme.hint_color }}>{t('setup.or')}</span>
            <div className="flex-1 h-px" style={{ backgroundColor: `${theme.hint_color}44` }} />
          </div>

          {/* Resume upload */}
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={resumeLoading}
            className="w-full py-4 rounded-2xl border-2 border-dashed text-base font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            style={{
              borderColor: theme.button_color,
              color: theme.button_color,
              backgroundColor: `${theme.button_color}10`,
              opacity: resumeLoading ? 0.6 : 1,
            }}
          >
            {resumeLoading ? (
              <><LoadingSpinner size="sm" color={theme.button_color} /><span>{t('setup.reading_resume')}</span></>
            ) : (
              <>{t('setup.upload_resume')}</>
            )}
          </button>

          {/* Resume analysis */}
          {resumeAnalysis && (
            <div className="mt-4 mb-6 p-4 rounded-2xl" style={{ backgroundColor: theme.secondary_bg_color }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{t('setup.resume_analysis')}</span>
                <span className="text-xs" style={{ color: theme.hint_color }}>
                  {t('setup.confidence', { pct: Math.round(resumeAnalysis.confidence * 100) })}
                </span>
              </div>
              <div className="space-y-1 text-sm mb-3">
                <p><span style={{ color: theme.hint_color }}>{t('setup.role_label')}</span> <strong>{resumeAnalysis.suggested_role || '—'}</strong></p>
                <p><span style={{ color: theme.hint_color }}>{t('setup.level_label')}</span> <strong>{resumeAnalysis.suggested_level || '—'}</strong></p>
                {resumeAnalysis.tech_stack.length > 0 && (
                  <p><span style={{ color: theme.hint_color }}>{t('setup.stack_label')}</span> {resumeAnalysis.tech_stack.join(', ')}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleStartFromResume}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
                  style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
                >
                  {loading ? (
                    <><LoadingSpinner size="sm" color={theme.button_text_color} /><span>{t('setup.starting')}</span></>
                  ) : (
                    t('setup.start_resume')
                  )}
                </button>
                <button
                  onClick={() => setResumeAnalysis(null)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ backgroundColor: `${theme.hint_color}20`, color: theme.text_color }}
                >
                  {t('setup.edit')}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="mt-4 mb-4 p-3 rounded-xl text-sm text-center"
              style={{ backgroundColor: '#ff444420', color: '#ff4444' }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Start button */}
        <div className="space-y-3 mt-6">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor: canStart ? theme.button_color : `${theme.hint_color}44`,
              color: canStart ? theme.button_text_color : theme.hint_color,
              cursor: canStart ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color={theme.button_text_color} />
                <span>{t('setup.starting')}</span>
              </>
            ) : mode === 'behavioral' ? (
              t('behavioral.start')
            ) : (
              t('setup.start_interview')
            )}
          </button>

          {/* Limit reached message */}
          {isLimitReached && (
            <div
              className="p-4 rounded-2xl text-sm text-center space-y-3"
              style={{ backgroundColor: `${theme.hint_color}15`, color: theme.hint_color }}
            >
              <p>{t('setup.limit_reached', { count: maxPerMonth })}</p>
              <button
                onClick={() => router.push('/subscriptions')}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
              >
                {t('setup.upgrade')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
