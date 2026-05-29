export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  language_code?: string;
}

export type InterviewMode = 'technical' | 'behavioral';

export interface StarAnalysis {
  situation_score: number;
  task_score: number;
  action_score: number;
  result_score: number;
  situation_feedback?: string;
  task_feedback?: string;
  action_feedback?: string;
  result_feedback?: string;
}

export interface Question {
  question: string;
  category: string;
  expected_topics: string[];
  difficulty: string;
  mode?: InterviewMode;
}

export interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  tip: string;
  timing_analysis?: string | null;
  star_analysis?: StarAnalysis;
}

export interface InterviewSession {
  id: number;
  role: string;
  experience_level: string;
  mode: InterviewMode;
  started_at: string;
  completed: boolean;
  total_score?: number;
}

export interface StarBreakdown {
  situation: number;
  task: number;
  action: number;
  result: number;
  overall_star_score: number;
}

export interface SessionSummary {
  overall_assessment: string;
  key_strengths: string[];
  key_improvements: string[];
  topics_to_study: string[];
  overall_rating: string;
  star_breakdown?: StarBreakdown;
  competency_scores?: Record<string, number>;
}

export interface ProfileData {
  total_sessions: number;
  total_completed: number;
  avg_score: number;
  plan_name: string;
  max_per_month: number;
  recent_sessions: InterviewSession[];
}

export interface ApiError {
  ok: false;
  error: string;
}

export interface AuthResponse {
  ok: boolean;
  user?: TelegramUser;
  error?: string;
}

export interface StartInterviewResponse {
  session_id: number;
  question: Question;
  question_number: number;
  mode: InterviewMode;
}

export interface AnswerResponse {
  done: boolean;
  evaluation: Evaluation;
  next_question?: Question;
  question_number?: number;
  summary?: SessionSummary;
  transcribed?: string;
  mode?: InterviewMode;
}

export interface SessionResponse {
  session: InterviewSession;
  answers: AnswerItem[];
  summary?: SessionSummary;
}

export interface AnswerItem {
  question: Question;
  answer: string;
  evaluation: Evaluation;
  question_number: number;
}

export interface RoleInfo {
  id: number;
  name_en: string;
  name_ru: string;
  emoji: string;
  is_primary: boolean;
  is_free: boolean;
  available: boolean;
}

export interface RolesResponse {
  roles: RoleInfo[];
  levels: string[];
}

export interface ResumeAnalysis {
  target_role: string | null;
  seniority_level: string | null;
  suggested_role: string | null;
  suggested_level: string | null;
  tech_stack: string[];
  years_experience: number | null;
  key_skills: string[];
  confidence: number;
  raw_title: string | null;
}

export interface TariffPlanInfo {
  id: number;
  name: string;
  price: number;
  max_per_month: number;
  features: string;
  stripe_price_id: string | null;
  star_price: number;
  features_ru: string | null;
}

export interface CompanyInfo {
  id: string;
  name_en: string;
  name_ru: string;
  emoji: string;
  is_free: boolean;
  available: boolean;
}
