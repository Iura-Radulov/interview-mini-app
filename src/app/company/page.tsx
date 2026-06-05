'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTheme } from '@/lib/telegram';
import { useAuth } from '@/components/TelegramProvider';
import { getUserCompanies, createUserCompany, deleteUserCompany, getProfile, startInterview } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import type { UserCompany } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';

export default function CompanyPage() {
  const theme = getTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t, uiLang } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth & plan
  const [planName, setPlanName] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  // Company list
  const [companies, setCompanies] = useState<UserCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Start interview
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);

  const isPremium = planName === 'Premium';

  // Load profile + companies
  useEffect(() => {
    getProfile()
      .then((p) => setPlanName(p.plan_name))
      .catch(() => setPlanName('Free'))
      .finally(() => setPlanLoading(false));

    getUserCompanies()
      .then((data) => {
        const companiesData = data.companies || [];
        setCompanies(companiesData);
        // Pre-select company from ?id= query param (from dashboard link)
        const companyIdParam = searchParams.get('id');
        if (companyIdParam) {
          const id = Number(companyIdParam);
          if (companiesData.some((c) => c.id === id)) {
            setSelectedCompanyId(id);
          }
        }
      })
      .catch(() => setError(t('company.failed_load')))
      .finally(() => setLoading(false));
  }, [searchParams]);

  async function handleCreate() {
    if (!user?.id || !newName.trim() || !newPosition.trim() || !newUrl.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createUserCompany(user.id, newName.trim(), newUrl.trim(), newPosition.trim());
      setCompanies((prev) => [created, ...prev]);
      setNewName('');
      setNewPosition('');
      setNewUrl('');
      setShowForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('company.create_failed'));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(companyId: number) {
    try {
      await deleteUserCompany(companyId);
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
      if (selectedCompanyId === companyId) setSelectedCompanyId(null);
    } catch {
      setError(t('company.delete_failed'));
    }
  }

  // Parse role and level from position string (handles Russian & English)
  function parsePosition(pos: string): { role: string; level: string } {
    // Level — broad matching
    const levelMap: Record<string, string> = {
      junior: 'Junior', джуниор: 'Junior', младший: 'Junior',
      mid: 'Mid', middle: 'Mid', мид: 'Mid',
      senior: 'Senior', синьор: 'Senior', старший: 'Senior',
      lead: 'Senior', principal: 'Senior', лид: 'Senior',
    };
    const levelPattern = /\b(Junior|Middle|Senior|Lead|Principal|Джуниор|Мид|Синьор|Лид|Старший|Младший)\b/i;
    const levelMatch = pos.match(levelPattern);
    const level = levelMatch ? levelMap[levelMatch[1].toLowerCase()] || 'Mid' : 'Mid';

    // Role — try to match known keywords
    const roleKeywords = /\b(Frontend|Backend|Fullstack|Full.?stack|Front.?end|Back.?end|Фулстек|Фронтенд|Бэкенд|Python|Java|JavaScript|TypeScript|React|DevOps|QA|System.?Design|Mobile|iOS|Android|Data|ML|AI)\b/i;
    const roleMatch = pos.match(roleKeywords);
    let role = roleMatch ? roleMatch[1] : null;
    if (role && role.toLowerCase().replace(/[.\s]/g, '') === 'fullstack') role = 'Fullstack';
    if (!role) role = pos; // fallback: use entire position as role

    return { role, level };
  }

  function handleStartInterview() {
    if (!selectedCompanyId) return;
    const c = companies.find((c) => c.id === selectedCompanyId);
    if (!c) return;

    const pos = (c.position || '').trim();
    if (!pos) {
      // No position set — go to setup
      router.push(`/setup?user_company=${encodeURIComponent(c.company_name)}&ucid=${c.id}`);
      return;
    }

    const { role, level } = parsePosition(pos);
    setStarting(true);
    startInterview(role, level, undefined, 'technical', undefined, c.id)
      .then((result) => {
        sessionStorage.setItem(`interview_${result.session_id}_q1`, JSON.stringify(result.question));
        sessionStorage.setItem(`interview_${result.session_id}_mode`, result.mode);
        router.push(`/interview?session=${result.session_id}&q=1`);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('company.start_failed'));
        setStarting(false);
      });
  }

  // ── Loading / Premium guard ───────────────────────────────────────────────────

  if (planLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div
          className="min-h-screen flex flex-col items-center justify-center p-8 max-w-sm mx-auto"
          style={{ backgroundColor: theme.bg_color, color: theme.text_color }}
        >
          <div className="text-6xl mb-5">🔒</div>
          <h2 className="text-xl font-bold mb-2 text-center">{t('company.premium_title')}</h2>
          <p className="text-sm text-center mb-6" style={{ color: theme.hint_color }}>
            {t('company.premium_desc')}
          </p>
          <button
            onClick={() => router.push('/subscriptions')}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
            style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
          >
            {t('company.upgrade')}
          </button>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            getUserCompanies()
              .then((data) => setCompanies(data.companies || []))
              .catch(() => setError(t('company.failed_load')))
              .finally(() => setLoading(false));
          }}
          className="px-6 py-3 rounded-2xl font-medium text-sm"
          style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
        >
          {t('company.retry')}
        </button>
      </div>
    );
  }

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

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
          <h1 className="text-xl font-bold">{t('company.title')}</h1>
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

        {/* Description */}
        <p className="text-sm mb-5" style={{ color: theme.hint_color }}>
          {t('company.description')}
        </p>

        {/* ── Add Company Button / Form ── */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all active:scale-95 mb-5"
            style={{
              borderColor: theme.button_color,
              color: theme.button_color,
              backgroundColor: `${theme.button_color}10`,
            }}
          >
            + {t('company.add_company')}
          </button>
        ) : (
          <div
            className="p-4 rounded-2xl mb-5 space-y-3"
            style={{ backgroundColor: theme.secondary_bg_color }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.hint_color }}>
              {t('company.add_header')}
            </p>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('company.name_placeholder')}
              className="w-full p-3 rounded-xl text-sm outline-none border-2"
              style={{
                backgroundColor: theme.bg_color,
                color: theme.text_color,
                borderColor: `${theme.hint_color}30`,
              }}
            />
            <input
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder={t('company.position_placeholder')}
              className="w-full p-3 rounded-xl text-sm outline-none border-2"
              style={{
                backgroundColor: theme.bg_color,
                color: theme.text_color,
                borderColor: `${theme.hint_color}30`,
              }}
            />
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder={t('company.url_placeholder')}
              className="w-full p-3 rounded-xl text-sm outline-none border-2"
              style={{
                backgroundColor: theme.bg_color,
                color: theme.text_color,
                borderColor: `${theme.hint_color}30`,
              }}
            />
            {createError && (
              <p className="text-xs" style={{ color: '#ef4444' }}>{createError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(false); setCreateError(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                style={{ backgroundColor: `${theme.hint_color}20`, color: theme.text_color }}
              >
                {t('company.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim() || !newPosition.trim() || !newUrl.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
              >
                {creating ? '...' : t('company.save')}
              </button>
            </div>
          </div>
        )}

        {/* ── Company List ── */}
        {companies.length === 0 ? (
          <div
            className="p-8 rounded-2xl text-center mb-5"
            style={{ backgroundColor: theme.secondary_bg_color }}
          >
            <p className="text-4xl mb-3">🏢</p>
            <p className="text-sm" style={{ color: theme.hint_color }}>
              {t('company.empty')}
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-5">
            {companies.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3.5 rounded-2xl"
                style={{ backgroundColor: theme.secondary_bg_color }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.company_name}</p>
                  {c.position && (
                    <p className="text-xs truncate" style={{ color: theme.hint_color }}>{c.position}</p>
                  )}
                  {c.vacancy_url && (
                    <p className="text-[10px] truncate mt-0.5" style={{ color: theme.hint_color }}>{c.vacancy_url}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all active:scale-90"
                  style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Start Interview Section ── */}
        <div className="flex-1 flex flex-col justify-end pb-4">
          <p className="text-sm font-semibold mb-3">{t('company.start_section')}</p>

          <select
            value={selectedCompanyId ?? ''}
            onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : null)}
            className="w-full p-4 rounded-2xl text-sm border-2 outline-none appearance-none mb-4"
            style={{
              backgroundColor: theme.secondary_bg_color,
              color: theme.text_color,
              borderColor: selectedCompanyId ? theme.button_color : `${theme.hint_color}44`,
            }}
          >
            <option value="" style={{ color: theme.hint_color }}>
              {t('company.select_company')}
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id} style={{ color: theme.text_color }}>
                {c.company_name}{c.position ? ` — ${c.position}` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handleStartInterview}
            disabled={!selectedCompanyId || starting}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95 disabled:opacity-40"
            style={{
              backgroundColor: selectedCompanyId && !starting ? theme.button_color : `${theme.hint_color}30`,
              color: selectedCompanyId && !starting ? theme.button_text_color : theme.hint_color,
            }}
          >
            {starting ? (
              <><LoadingSpinner size="sm" color={theme.button_text_color ?? '#fff'} /> Starting…</>
            ) : (
              t('company.start_interview')
            )}
          </button>
        </div>
      </div>
    </>
  );
}
