export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
}

export interface Question {
  question: string;
  category: string;
  expected_topics: string[];
  difficulty: string;
}

export interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  tip: string;
}

export interface InterviewSession {
  id: number;
  role: string;
  experience_level: string;
  started_at: string;
  completed: boolean;
  total_score?: number;
}

export interface SessionSummary {
  overall_assessment: string;
  key_strengths: string[];
  key_improvements: string[];
  topics_to_study: string[];
  overall_rating: string;
}

export interface ProfileData {
  total_sessions: number;
  avg_score: number;
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
}

export interface AnswerResponse {
  done: boolean;
  evaluation: Evaluation;
  next_question?: Question;
  question_number?: number;
  summary?: SessionSummary;
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

export interface RolesResponse {
  roles: string[];
  levels: string[];
}
