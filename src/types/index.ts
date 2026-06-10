export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  language_code?: string;
}

export type InterviewMode = 'technical' | 'behavioral' | 'system_design';

export interface StarAnalysis {
  situation_score: number;
  task_score: number;
  action_score: number;
  result_score: number;
  situation_feedback?: string;
}

export interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  tip: string;
  star_analysis?: StarAnalysis;
  competencies?: string[];
  timing_analysis?: string;
}

export interface Question {
  question_text: string;
  question_number: number;
  mode: InterviewMode;
  competency?: string;
  tip?: string;
  category?: string;
  difficulty?: string;
  expected_topics?: string[];
}

export interface InterviewSession {
  id: number;
  role: string;
  experience_level: string;
  mode: InterviewMode;
  started_at: string;
  completed: boolean;
  total_questions: number;
  answered_questions: number;
  total_score: number | null;
  current_question_number: number | null;
}

export interface SessionSummary {
  total_score: number;
  key_strengths: string[];
  key_improvements: string[];
  topics_to_study: string[];
  question_breakdown: { question: string; score: number; feedback: string }[];
  overall_rating?: string;
  overall_assessment?: string;
  star_breakdown?: {
    overall_star_score: number;
    situation: number;
    task: number;
    action: number;
    result: number;
  };
  competency_scores?: Record<string, number>;
}

export interface ProfileData {
  total_sessions: number;
  total_completed: number;
  avg_score: number;
  plan_name: string;
  max_per_month: number;
  recent_sessions: InterviewSession[];
  features: string[];
  features_ru: string[] | null;
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
  id?: number;
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

export interface GapAnalysis {
  profile_summary: string;
  overall_fit: 'Excellent' | 'Good' | 'Moderate' | 'Weak';
  strengths: string[];
  gaps: string[];
  focus_areas: string[];
  expected_difficulty: 'Expected' | 'Harder' | 'Easier';
  preparation_tip: string;
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

export interface UserCompany {
  id: number;
  company_name: string;
  vacancy_url: string;
  position: string;
  ai_context: string;
  created_at: string;
}


// ── Study Plan ──────────────────────────────────────────────────────────────────

export interface StudyPlanSessionMeta {
  id: number;
  role: string;
  mode: string;
  started_at: string | null;
  completed: boolean;
  total_score: number | null;
  experience_level: string;
}

export interface StudyPlanDay {
  id: number;
  day_number: number;
  title: string;
  description: string;
  resources: { title: string; url: string; type: string }[];
  estimated_minutes: number | null;
  is_completed: boolean;
  completed_at: string | null;
}

export interface StudyPlanSummary {
  id: number;
  title: string;
  description: string;
  focus_areas: string[];
  duration_days: number;
  status: 'active' | 'paused' | 'completed';
  progress_percent: number;
  source_type: string;
  source_params: Record<string, any>;
  language: string;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_days: number;
  completed_days: number;
}

export interface StudyPlanDetail extends StudyPlanSummary {
  days: StudyPlanDay[];
  session_ids: number[];
}
