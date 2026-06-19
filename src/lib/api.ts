'use client';

import type {
  AuthResponse,
  StartInterviewResponse,
  AnswerResponse,
  SessionResponse,
  ProfileData,
  Question,
  RolesResponse,
  ResumeAnalysis,
  TariffPlanInfo,
  CompanyInfo,
  UserCompany,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';  // empty = same origin (rewritten via next.config.ts)

let initData = '';
let currentUserId: number | undefined;

export function setInitData(data: string): void {
  initData = data;
}

export function setUserId(id: number): void {
  currentUserId = id;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  userId?: number,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const mergedOptions: RequestInit = { ...options, headers };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, mergedOptions);
      if (res.status >= 500 && attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Network error');
}

function handleApiError(status: number): never {
  if (status === 401 || status === 403) {
    throw new Error('Session expired. Please reopen the Mini App.');
  }
  if (status === 429) {
    throw new Error('Monthly limit reached. Upgrade to Pro for unlimited access — /plan');
  }
  if (status >= 500) {
    throw new Error('Server error. Please try again later.');
  }
  throw new Error('Request failed.');
}

export async function auth(): Promise<AuthResponse> {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/api/auth`, {
      method: 'POST',
      body: JSON.stringify({ init_data: initData }),
    });
    if (!res.ok) handleApiError(res.status);
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}

export async function startInterview(
  role: string,
  level: string,
  companyId?: string,
  mode: string = 'technical',
  skills?: string,
  userCompanyId?: number,
  resumeId?: number,
): Promise<StartInterviewResponse> {
  try {
    const body: Record<string, string | number> = { role, level, mode };
    if (companyId && companyId !== 'general') {
      body.company_id = companyId;
    }
    if (skills && skills.trim()) {
      body.skills = skills.trim();
    }
    if (userCompanyId) {
      body.user_company_id = userCompanyId;
    }
    if (resumeId) {
      body.resume_id = resumeId;
    }
    const res = await fetchWithRetry(`${BASE_URL}/api/interview/start`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) handleApiError(res.status);
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}

export async function submitAnswer(
  sessionId: number,
  answer: string,
  questionText?: string,
  timeTakenSeconds?: number,
  resumeId?: number,
): Promise<AnswerResponse> {
  try {
    const body: Record<string, any> = { session_id: sessionId, answer, question_text: questionText };
    if (timeTakenSeconds !== undefined) body.time_taken_seconds = timeTakenSeconds;
    if (resumeId) body.resume_id = resumeId;
    const res = await fetchWithRetry(`${BASE_URL}/api/interview/answer`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) handleApiError(res.status);
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}


export async function voiceAnswer(
  sessionId: number,
  questionText: string,
  audioBlob: Blob,
  timeTakenSeconds?: number,
): Promise<AnswerResponse> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice.webm');
    formData.append('session_id', String(sessionId));
    formData.append('question_text', questionText);
    if (timeTakenSeconds !== undefined) {
      formData.append('time_taken_seconds', String(timeTakenSeconds));
    }

    const headers: Record<string, string> = {};
    if (initData) {
      headers['X-Telegram-Init-Data'] = initData;
    }
    if (!initData && currentUserId) {
      headers['X-User-ID'] = String(currentUserId);
    }

    const res = await fetchWithTimeout(`${BASE_URL}/api/interview/voice-answer`, {
      method: 'POST',
      body: formData,
      headers,
    }, 45000);  // 45s for Whisper transcription + AI evaluation
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Voice answer failed (${res.status})`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}


export async function getSession(sessionId: number): Promise<SessionResponse> {
  try {
    const res = await fetchWithRetry(
      `${BASE_URL}/api/interview/${sessionId}`,
      { method: 'GET' }
    );
    if (!res.ok) handleApiError(res.status);
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}

export async function getProfile(): Promise<ProfileData> {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/api/profile`, {
      method: 'GET',
    });
    if (!res.ok) handleApiError(res.status);
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}

export async function getRoles(): Promise<RolesResponse> {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/api/roles`, {
      method: 'GET',
    });
    if (!res.ok) handleApiError(res.status);
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}

export async function getCompanies(): Promise<{ companies: CompanyInfo[] }> {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/api/companies`, {
      method: 'GET',
    });
    if (!res.ok) handleApiError(res.status);
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}

export async function getNextQuestion(
  sessionId: number
): Promise<{ question: Question; question_number: number; mode?: string }> {
  try {
    const res = await fetchWithRetry(
      `${BASE_URL}/api/interview/${sessionId}/next-question`,
      { method: 'GET' }
    );
    if (!res.ok) handleApiError(res.status);
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}

export async function analyzeResume(pdfText: string): Promise<ResumeAnalysis> {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/api/resume/analyze`, {
      method: 'POST',
      body: JSON.stringify({ pdf_text: pdfText }),
    });
    if (!res.ok) handleApiError(res.status);
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}

export async function uploadResume(file: File): Promise<ResumeAnalysis> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (initData) {
      headers['X-Telegram-Init-Data'] = initData;
    }
    if (!initData && currentUserId) {
      headers['X-User-ID'] = String(currentUserId);
    }

    const res = await fetchWithTimeout(`${BASE_URL}/api/resume/upload`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (res.status === 400) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || 'Could not parse this PDF. It may be a scanned/image-only document.');
    }
    if (!res.ok) handleApiError(res.status);
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}

// ── Text-to-Speech ──────────────────────────────────────────────────────────

export async function fetchGapAnalysis(
  targetRole: string,
  targetLevel: string,
  resumeId?: number,
  skills?: string,
  companyId?: string,
  userCompanyId?: number,
): Promise<import('@/types').GapAnalysis> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    if (!initData && currentUserId) headers['X-User-ID'] = String(currentUserId);

    const body: Record<string, any> = { target_role: targetRole, target_level: targetLevel };
    if (resumeId) body.resume_id = resumeId;
    if (skills?.trim()) body.skills = skills.trim();
    if (companyId && companyId !== 'general') body.company_id = companyId;
    if (userCompanyId) body.user_company_id = userCompanyId;

    const res = await fetchWithRetry(`${BASE_URL}/api/interview/gap-analysis`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
    if (res.status === 404) {
      throw new Error('Resume not found. Please upload your CV again.');
    }
    if (!res.ok) handleApiError(res.status);
    return res.json();
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Connection lost. Check your internet.');
  }
}

// ── Text-to-Speech ──────────────────────────────────────────────────────────

export async function textToSpeech(text: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (initData) headers['X-Telegram-Init-Data'] = initData;

    const res = await fetchWithRetry(`${BASE_URL}/api/tts`, {
      method: 'POST',
      body: JSON.stringify({ text: text.slice(0, 2000) }),
      headers,
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.audio_base64 ?? null;
  } catch {
    return null;
  }
}

// ── Speech-to-Text ──────────────────────────────────────────────────────────

export async function transcribeAudio(audioBlob: Blob): Promise<string | null> {
  try {
    const formData = new FormData();
    // Determine extension from blob type
    const ext = audioBlob.type.includes('webm') ? '.webm' : '.ogg';
    formData.append('file', audioBlob, `recording${ext}`);

    const headers: Record<string, string> = {};
    if (initData) headers['X-Telegram-Init-Data'] = initData;
    if (!initData && currentUserId) {
      headers['X-User-ID'] = String(currentUserId);
    }

    const res = await fetchWithTimeout(`${BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
      headers,
    }, 30000);  // 30s for Whisper transcription

    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
  } catch {
    return null;
  }
}

// ── User Settings ───────────────────────────────────────────────────────────

export interface SettingsData {
  language: string;
  voice: string;
  ui_language?: string;
}

export async function getSettings(): Promise<SettingsData> {
  const headers: Record<string, string> = {};
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/settings`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(language: string, voice: string, uiLanguage?: string): Promise<SettingsData> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const body: Record<string, string> = { language, voice };
  if (uiLanguage !== undefined) {
    body.ui_language = uiLanguage;
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/settings`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save settings');
  }
  return res.json();
}

// ── Tariff Plans ──────────────────────────────────────────────────────────────

export async function getPlans(): Promise<TariffPlanInfo[]> {
  const headers: Record<string, string> = {};
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/plans`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) throw new Error('Failed to fetch plans');
  return res.json();
}

// ── User Companies ──────────────────────────────────────────────────────────

export async function getUserCompanies(): Promise<{ companies: UserCompany[] }> {
  const headers: Record<string, string> = {};
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/user-companies`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) throw new Error('Failed to fetch companies');
  return res.json();
}

export async function createUserCompany(
  telegramId: number,
  companyName: string,
  vacancyUrl: string,
  position: string,
): Promise<UserCompany> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/user-companies/create`, {
    method: 'POST',
    body: JSON.stringify({
      telegram_id: telegramId,
      company_name: companyName,
      vacancy_url: vacancyUrl,
      position,
    }),
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create company');
  }
  return res.json();
}

export async function deleteUserCompany(companyId: number): Promise<void> {
  const headers: Record<string, string> = {};
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/user-companies/${companyId}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete company');
  }
}

// ── Telegram Stars Invoice ─────────────────────────────────────────────────────

export async function createStarsInvoice(planName: string): Promise<{ invoice_url: string; star_price: number; plan: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/stars/invoice`, {
    method: 'POST',
    body: JSON.stringify({ plan_name: planName }),
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create invoice');
  }
  return res.json();
}


// ── Study Plan API ────────────────────────────────────────────────────────────

export async function getSessionsForPlan(
  mode?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<{ sessions: import('@/types').StudyPlanSessionMeta[] }> {
  const headers: Record<string, string> = {};
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const params = new URLSearchParams();
  if (mode) params.set('mode', mode);
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  const qs = params.toString();

  const res = await fetchWithRetry(`${BASE_URL}/api/study/sessions-for-plan${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) handleApiError(res.status);
  return res.json();
}

export async function generateStudyPlan(
  mode?: string,
  dateFrom?: string,
  dateTo?: string,
  durationDays: number = 7,
  language: string = 'en',
): Promise<{ ok: boolean; plan: import('@/types').StudyPlanSummary; message: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const body: Record<string, any> = { duration_days: durationDays, language };
  if (mode) body.mode = mode;
  if (dateFrom) body.date_from = dateFrom;
  if (dateTo) body.date_to = dateTo;

  const res = await fetchWithRetry(`${BASE_URL}/api/study/plans/generate`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
  if (!res.ok) handleApiError(res.status);
  return res.json();
}

export async function getStudyPlans(): Promise<{ plans: import('@/types').StudyPlanSummary[] }> {
  const headers: Record<string, string> = {};
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/study/plans`, { method: 'GET', headers });
  if (!res.ok) handleApiError(res.status);
  return res.json();
}

export async function getStudyPlanDetail(planId: number): Promise<{ plan: import('@/types').StudyPlanDetail }> {
  const headers: Record<string, string> = {};
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/study/plans/${planId}`, { method: 'GET', headers });
  if (!res.ok) handleApiError(res.status);
  return res.json();
}

export async function updateStudyPlanStatus(planId: number, status: string): Promise<{ ok: boolean; status: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/study/plans/${planId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    headers,
  });
  if (!res.ok) handleApiError(res.status);
  return res.json();
}

export async function toggleStudyPlanDay(planId: number, dayId: number): Promise<{ ok: boolean }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/study/plans/${planId}/toggle-day`, {
    method: 'POST',
    body: JSON.stringify({ day_id: dayId }),
    headers,
  });
  if (!res.ok) handleApiError(res.status);
  return res.json();
}


// ── Guided System Design API ────────────────────────────────────────────


export async function startSystemDesign(
  problem: string,
  level: string,
  company: string = 'general',
): Promise<{
  session_id: number;
  step: number;
  step_name: string;
  prompt: string;
  hints: string[];
  total_steps: number;
}> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/system-design/start`, {
    method: 'POST',
    body: JSON.stringify({ problem, level, company }),
    headers,
  });
  if (!res.ok) handleApiError(res.status);
  return res.json();
}

export async function submitSystemDesignStep(
  sessionId: number,
  answer: string,
): Promise<{
  done: boolean;
  step: number;
  step_name?: string;
  prompt?: string;
  hints?: string[];
  score?: number;
  feedback?: string;
  evaluation?: Record<string, any> | null;
}> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/system-design/step`, {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, answer }),
    headers,
  });
  if (!res.ok) handleApiError(res.status);
  return res.json();
}


export async function getSystemDesignHistory(): Promise<{
  sessions: Array<{
    id: number;
    problem: string;
    level: string;
    completed: boolean;
    total_score: number | null;
    started_at: string | null;
    current_step: number;
  }>;
}> {
  const headers: Record<string, string> = {};
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/system-design/history`, { headers });
  if (!res.ok) handleApiError(res.status);
  return res.json();
}

export interface SystemDesignSessionDetail {
  id: number;
  problem: string;
  level: string;
  company: string;
  completed: boolean;
  current_step: number;
  total_steps: number;
  total_score: number | null;
  step_context: Array<{
    step: number;
    step_name: string;
    prompt: string;
    answer: string;
    score: number;
    feedback: string;
  }>;
  step_scores: Array<{ step: number; score: number }>;
  summary: SdEvalSummary | null;
  started_at: string | null;
}

export interface SdEvalSummary {
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

export async function getSystemDesignSession(sessionId: number): Promise<SystemDesignSessionDetail> {
  const headers: Record<string, string> = {};
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  if (!initData && currentUserId) {
    headers['X-User-ID'] = String(currentUserId);
  }

  const res = await fetchWithRetry(`${BASE_URL}/api/system-design/session/${sessionId}`, { headers });
  if (!res.ok) handleApiError(res.status);
  return res.json();
}
