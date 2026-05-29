'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTheme } from '@/lib/telegram';
import { useAuth } from '@/components/TelegramProvider';
import { getProfile, getPlans, createStarsInvoice } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import type { ProfileData, TariffPlanInfo } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import Sidebar from '@/components/Sidebar';

function planColor(name: string): { bg: string; text: string; border: string } {
  switch (name) {
    case 'Pro':
      return { bg: '#22c55e20', text: '#22c55e', border: '#22c55e' };
    case 'Premium':
      return { bg: '#a855f720', text: '#a855f7', border: '#a855f7' };
    default:
      return { bg: '#64748b20', text: '#64748b', border: '#64748b33' };
  }
}

function parseFeatures(featuresStr: string): string[] {
  try {
    const parsed = JSON.parse(featuresStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function SubscriptionsPage() {
  const theme = getTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { t, uiLang } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [plans, setPlans] = useState<TariffPlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingStars, setBuyingStars] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [profileData, plansData] = await Promise.all([getProfile(), getPlans()]);
      setProfile(profileData);
      setPlans(plansData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('subs.failed_load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleBuyStars(planName: string) {
    setBuyingStars(planName);
    setError(null);
    try {
      const { invoice_url } = await createStarsInvoice(planName);
      // Open Telegram Stars invoice
      const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
      if (tg?.openInvoice) {
        tg.openInvoice(invoice_url, (status) => {
          if (status === 'paid') {
            // Refresh profile to show new plan
            getProfile().then(setProfile).catch(() => {});
          }
        });
      } else {
        // Fallback: open in new tab (works in browser dev)
        window.open(invoice_url, '_blank');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setBuyingStars(null);
    }
  }

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
          onClick={() => { setLoading(true); setError(null); fetchData(); }}
          className="px-6 py-3 rounded-2xl font-medium text-sm"
          style={{ backgroundColor: theme.button_color, color: theme.button_text_color }}
        >
          {t('subs.retry')}
        </button>
      </div>
    );
  }

  const currentPlanName = profile?.plan_name || 'Free';

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
          <h1 className="text-xl font-bold">{t('subs.title')}</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm"
            style={{ color: theme.button_color }}
          >
            {t('subs.dashboard')}
          </button>
        </div>

        {/* Current plan card */}
        {profile && (
          <div
            className="p-5 rounded-2xl mb-6 border"
            style={{
              backgroundColor: planColor(currentPlanName).bg,
              borderColor: planColor(currentPlanName).border,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.hint_color }}>
              {t('subs.current_plan')}
            </p>
            <p className="text-xl font-bold" style={{ color: planColor(currentPlanName).text }}>
              {currentPlanName}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm text-center" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
            ❌ {error}
          </div>
        )}

        {/* All plans */}
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.hint_color }}>
          {t('subs.available_plans')}
        </p>

        <div className="space-y-4 pb-6">
          {plans.map((plan) => {
            const isCurrent = plan.name === currentPlanName;
            const badge = planColor(plan.name);
            const features = parseFeatures(
              uiLang === 'ru' && plan.features_ru ? plan.features_ru : plan.features
            );
            const hasStars = Number(plan.star_price) > 0;

            return (
              <div
                key={plan.id}
                className="p-5 rounded-2xl border"
                style={{
                  backgroundColor: isCurrent ? badge.bg : theme.secondary_bg_color,
                  borderColor: isCurrent ? badge.border : `${theme.hint_color}25`,
                }}
              >
                {/* Plan header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-lg font-bold" style={{ color: isCurrent ? badge.text : theme.text_color }}>
                      {plan.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: theme.hint_color }}>
                      {plan.stripe_price_id ? (
                        <>
                          <span className="text-base font-bold" style={{ color: isCurrent ? badge.text : theme.text_color }}>
                            ${plan.price.toFixed(2)}
                          </span>
                          {t('subs.per_month')}
                        </>
                      ) : plan.price === 0 ? (
                        'Free'
                      ) : (
                        `$${plan.price.toFixed(2)}${t('subs.per_month')}`
                      )}
                    </p>
                  </div>
                  {isCurrent && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: badge.text, color: '#ffffff' }}
                    >
                      {t('subs.current')}
                    </span>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-sm shrink-0" style={{ color: badge.text }}>✓</span>
                      <span className="text-sm" style={{ color: theme.text_color }}>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  {/* Stripe / Card payment button */}
                  {plan.stripe_price_id && (
                    <a
                      href={`https://techinterviewai.com/tariffs?plan=${plan.name.toLowerCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all active:scale-95"
                      style={{
                        backgroundColor: isCurrent ? `${theme.hint_color}33` : badge.text,
                        color: isCurrent ? theme.text_color : '#ffffff',
                        opacity: isCurrent ? 0.6 : 1,
                        pointerEvents: isCurrent ? 'none' : 'auto' as React.CSSProperties['pointerEvents'],
                      }}
                    >
                      {isCurrent ? t('subs.current') : t('subs.upgrade')}
                    </a>
                  )}

                  {!plan.stripe_price_id && plan.price === 0 && isCurrent && (
                    <div className="w-full py-3 rounded-xl text-sm font-semibold text-center"
                      style={{ backgroundColor: `${theme.hint_color}20`, color: theme.hint_color }}>
                      {t('subs.current')}
                    </div>
                  )}

                  {/* Stars payment button */}
                  {hasStars && (
                    <button
                      onClick={() => handleBuyStars(plan.name)}
                      disabled={buyingStars !== null}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-center transition-all active:scale-95 flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: `${theme.button_color}12`,
                        color: theme.button_color,
                        border: `2px solid ${theme.button_color}40`,
                        opacity: buyingStars !== null ? 0.6 : 1,
                      }}
                    >
                      {buyingStars === plan.name ? (
                        <><LoadingSpinner size="sm" color={theme.button_color} /><span>Processing...</span></>
                      ) : (
                        <>⭐ {plan.star_price} Stars</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Need help */}
        {currentPlanName !== 'Free' && (
          <div className="text-center mb-4">
            <p className="text-xs" style={{ color: theme.hint_color }}>
              {t('subs.contact_admin')}
            </p>
          </div>
        )}

        <div className="flex-1" />
      </div>
    </>
  );
}
