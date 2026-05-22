'use client';

import type {
  AuthResponse,
  StartInterviewResponse,
  AnswerResponse,
  SessionResponse,
  ProfileData,
  Question,
  RolesResponse,
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
  level: string
): Promise<StartInterviewResponse> {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/api/interview/start`, {
      method: 'POST',
      body: JSON.stringify({ role, level }),
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
  questionText?: string
): Promise<AnswerResponse> {
  try {
    const res = await fetchWithRetry(`${BASE_URL}/api/interview/answer`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, answer, question_text: questionText }),
    });
    if (!res.ok) handleApiError(res.status);
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

export async function getNextQuestion(
  sessionId: number
): Promise<{ question: Question; question_number: number }> {
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
