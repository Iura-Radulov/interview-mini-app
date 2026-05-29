'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTheme } from '@/lib/telegram';
import { useAuth } from '@/components/TelegramProvider';
import { getSettings, updateSettings, getProfile } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English (default)' },
  { code: 'ru', label: '🇷🇺 Русский' },
];

const UI_LANGUAGES = [
  { code: 'en', labelKey: 'settings.lang_en' },
  { code: 'ru', labelKey: 'settings.lang_ru' },
];

const VOICES = [
  { id: 'alloy', name: 'Alloy', gender: 'Neutral' },
  { id: 'echo', name: 'Echo', gender: 'Male' },
  { id: 'fable', name: 'Fable', gender: 'Neutral' },
  { id: 'onyx', name: 'Onyx', gender: 'Male' },
  { id: 'nova', name: 'Nova', gender: 'Female' },
  { id: 'shimmer', name: 'Shimmer', gender: 'Female' },
];

interface UserSettings {
  language: string;
  voice: string;
  planName: string;
}

export default function SettingsPage() {
  const theme = getTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { t, uiLang, setUiLang } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      const plan = await getProfile().catch(() => ({ plan_name: 'Free' }));
      setSettings({
        language: data.language || 'en',
        voice: data.voice || 'alloy',
        planName: plan.plan_name || 'Free',
      });
    } catch {
      setError(t('settings.failed_load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const isPaid = settings?.planName === 'Pro' || settings?.planName === 'Premium';

  async function handleSave(language: string, voice: string) {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateSettings(language, voice, uiLang);
      setSettings((prev) => prev ? { ...prev, language: result.language, voice: result.voice } : prev);
      setSuccess(t('settings.saved'));
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('settings.failed_save'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
          <h1 className="text-xl font-bold">{t('settings.title')}</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm"
            style={{ color: theme.button_color }}
          >
            {t('settings.dashboard')}
          </button>
        </div>

        {/* Current plan info */}
        <div
          className="p-3 rounded-2xl mb-6 text-sm flex items-center gap-2"
          style={{
            backgroundColor: isPaid ? '#22c55e15' : `${theme.hint_color}15`,
            color: isPaid ? '#22c55e' : theme.hint_color,
          }}
        >
          <span>{isPaid ? '⚡' : '📦'}</span>
          <span>
            {isPaid
              ? t('settings.plan_paid', { plan: settings?.planName || '' })
              : t('settings.plan_free')}
          </span>
        </div>

        {/* ── UI Language ── */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.hint_color }}>
            {t('settings.ui_language')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {UI_LANGUAGES.map((lang) => {
              const isSelected = uiLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setUiLang(lang.code as 'en' | 'ru')}
                  className="flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all active:scale-98"
                  style={{
                    borderColor: isSelected ? theme.button_color : `${theme.hint_color}30`,
                    backgroundColor: isSelected ? `${theme.button_color}12` : theme.secondary_bg_color,
                  }}
                >
                  <span className="text-sm font-semibold">{t(lang.labelKey)}</span>
                  {isSelected && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}>
                      {t('settings.active')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Interview Language ── */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.hint_color }}>
            {t('settings.interview_language')}
          </p>
          <div className="space-y-2">
            {LANGUAGES.map((lang) => {
              const isSelected = settings?.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSave(lang.code, settings?.voice || 'alloy')}
                  disabled={saving}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-98"
                  style={{
                    borderColor: isSelected ? theme.button_color : `${theme.hint_color}30`,
                    backgroundColor: isSelected ? `${theme.button_color}12` : theme.secondary_bg_color,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: isSelected ? theme.button_color : `${theme.hint_color}20` }}
                  >
                    ✓
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{lang.label}</p>
                  </div>
                  {isSelected && (
                    <span className="ml-auto text-xs font-medium" style={{ color: theme.button_color }}>
                      {t('settings.active')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Voice selection ── */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.hint_color }}>
            {t('settings.voice')}
          </p>
          {!isPaid && (
            <p className="text-xs mb-3 p-2 rounded-xl" style={{ backgroundColor: '#ef444415', color: '#ef4444' }}>
              {t('settings.voice_free')}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {VOICES.map((voice) => {
              const isSelected = settings?.voice === voice.id;
              const isDisabled = !isPaid && !isSelected;
              return (
                <button
                  key={voice.id}
                  onClick={() => {
                    if (isPaid && !saving) {
                      handleSave(settings?.language || 'en', voice.id);
                    }
                  }}
                  disabled={isDisabled || saving}
                  className="flex flex-col items-center p-4 rounded-2xl border-2 transition-all active:scale-95"
                  style={{
                    borderColor: isSelected ? theme.button_color : `${theme.hint_color}25`,
                    backgroundColor: isSelected ? `${theme.button_color}12` : theme.secondary_bg_color,
                    opacity: isDisabled ? 0.4 : 1,
                  }}
                >
                  <span className="text-2xl mb-1">
                    {voice.gender === 'Male' ? '👨' : voice.gender === 'Female' ? '👩' : '🧑'}
                  </span>
                  <span className="text-sm font-semibold">{voice.name}</span>
                  <span className="text-[10px] mt-0.5" style={{ color: theme.hint_color }}>
                    {voice.gender}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] mt-1 px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}>
                      {t('settings.active')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Success/Error messages */}
        {success && (
          <div
            className="p-3 rounded-xl text-sm text-center mb-4"
            style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}
          >
            ✅ {success}
          </div>
        )}
        {error && (
          <div
            className="p-3 rounded-xl text-sm text-center mb-4"
            style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
          >
            ❌ {error}
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={() => router.push('/setup')}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95"
          style={{
            backgroundColor: theme.button_color,
            color: theme.button_text_color,
          }}
        >
          {t('settings.start_interview')}
        </button>
      </div>
    </>
  );
}
