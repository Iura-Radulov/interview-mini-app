'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings } from './api';

// ── Translation dictionary ─────────────────────────────────────────────────────

export const translations: Record<string, Record<string, string>> = {
  en: {
    /* Sidebar */
    'nav.dashboard': 'Dashboard',
    'nav.start_interview': 'Start Interview',
    'nav.profile': 'Profile',
    'nav.history': 'History',
    'nav.settings': 'Settings',
    'nav.subscriptions': 'Subscriptions',
    'nav.company': 'Company Link',
    'nav.system_design': 'System Design',
    'nav.resume_analysis': 'Resume Analysis',
    'nav.open_browser': 'opens in browser',
    'sidebar.footer': 'AI Interview Practice v1.0',

    /* Dashboard */
    'dashboard.welcome': '👋 Welcome',
    'dashboard.ready': 'Ready for today\'s practice?',
    'dashboard.current_plan': 'Current Plan',
    'dashboard.plan_free': '2 interviews / month',
    'dashboard.plan_pro': 'Unlimited interviews',
    'dashboard.plan_premium': 'Everything included',
    'dashboard.this_month': 'This Month',
    'dashboard.completed': 'Completed',
    'dashboard.avg_score': 'Avg Score',
    'dashboard.recent_sessions': 'Recent Sessions',
    'dashboard.no_sessions': 'No sessions yet. Start your first interview!',
    'dashboard.start_interview': '🎯 Start Interview',
    'dashboard.of': 'of',
    'dashboard.in_progress': 'In progress',
    'dashboard.failed_load': 'Failed to load.',
    'dashboard.retry': 'Retry',
    'dashboard.upgrade_pro': '⭐ Upgrade to Pro',
    'dashboard.upgrade_premium': '⭐ Upgrade to Premium',

    /* Profile */
    'profile.my_profile': 'My Profile',
    'profile.dashboard': 'Dashboard →',
    'profile.sessions_completed': '{count} session{s} completed',
    'profile.getting_started': 'Getting started',
    'profile.avg_score': '⭐ Avg score: {score}',
    'profile.subscription': 'Subscription',
    'profile.upgrade_pro': '⭐ Upgrade to Pro',
    'profile.upgrade_premium': '⭐ Upgrade to Premium',
    'profile.start_new': '🎯 Start New Interview',
    'profile.view_history': '📋 View Interview History',
    'profile.failed_load': 'Failed to load profile.',
    'profile.retry': 'Retry',
    'profile.user': 'User',

    /* History */
    'history.title': 'History',
    'history.dashboard': 'Dashboard →',
    'history.total': 'Total',
    'history.completed': 'Completed',
    'history.avg_score': 'Avg Score',
    'history.all_sessions': 'My Interviews',
    'history.empty_text': 'No sessions yet.',
    'history.empty_hint': 'Start your first interview to see results here.',
    'history.start_interview': 'Start Interview',
    'history.in_progress': '● In progress',
    'history.resume': 'Resume',
    'history.failed_load': 'Failed to load history.',
    'history.retry': 'Retry',

    /* StartScreen (Setup) */
    'setup.back_dashboard': '← Dashboard',
    'setup.title': 'AI Interview Practice',
    'setup.subtitle': '5 questions · Real-time feedback',
    'setup.select_role': 'Select Role',
    'setup.select_level': 'Experience Level',
    'setup.or': 'or',
    'setup.upload_resume': '📄 Upload Resume (PDF)',
    'setup.reading_resume': 'Reading resume...',
    'setup.resume_analysis': '📋 Resume Analysis',
    'setup.confidence': '{pct}% confidence',
    'setup.role_label': 'Role:',
    'setup.level_label': 'Level:',
    'setup.stack_label': 'Stack:',
    'setup.start_resume': '✅ Start Interview',
    'setup.starting': 'Starting...',
    'setup.edit': '✏️ Edit',
    'setup.failed_start': 'Failed to start. Try again.',
    'setup.failed_parse': 'Could not determine role or level from resume. Please select manually.',
    'setup.failed_upload': 'Failed to analyze resume',
    'setup.start_interview': 'Start Interview',

    /* Skills */
    'setup.other_roles': 'Other Roles',
    'setup.skills_label': 'Skills (optional)',
    'setup.skills_placeholder': 'JS, React',
    'setup.limit_reached': "You've used all {count} free interviews this month. Upgrade to Pro or Premium for unlimited access.",
    'setup.upgrade': '⭐ Upgrade',

    /* InterviewFlow */
    'interview.load_error': 'Could not load question. Please try again.',
    'interview.submit_error': 'Failed to submit answer.',
    'interview.next_error': 'Could not load next question. Please try again.',
    'interview.go_profile': 'Go to Profile',

    /* QuestionCard */
    'qcard.placeholder': 'Type your answer here…',
    'qcard.recording_placeholder': 'Recording… your voice will be transcribed automatically',
    'qcard.transcribing': 'Transcribing voice…',
    'qcard.submit': 'Submit Answer',
    'qcard.evaluating': 'Evaluating…',

    /* EvaluationCard */
    'eval.title': 'Evaluation',
    'eval.strengths': 'Strengths',
    'eval.improvements': 'Improvements',
    'eval.tip': 'Tip: ',
    'eval.exit_title': 'Exit Interview?',
    'eval.exit_desc': 'You can continue this interview later from your profile.',
    'eval.cancel': 'Cancel',
    'eval.exit': 'Exit',
    'eval.view_summary': 'View Summary',
    'eval.next_question': 'Next Question',

    /* SummaryView (in-progress) */
    'summary.in_progress': 'Interview in Progress',
    'summary.history': '← History',
    'summary.progress': 'Progress',
    'summary.questions_answered': 'Questions Answered',
    'summary.continue': 'Continue Interview',
    'summary.go_home': 'Go Home',
    'summary.failed_load': 'Failed to load session.',

    /* SummaryCard */
    'summary_card.title': 'Session Summary',
    'summary_card.your_answer': 'Your Answer',
    'summary_card.feedback': 'Feedback',
    'summary_card.key_strengths': 'Key Strengths',
    'summary_card.areas_improve': 'Areas to Improve',
    'summary_card.topics_study': 'Topics to Study',
    'summary_card.question_breakdown': 'Question Breakdown',
    'summary_card.practice_again': 'Practice Again',
    'summary_card.view_profile': 'View Profile',

    /* Settings */
    'settings.title': 'Settings',
    'settings.dashboard': 'Dashboard →',
    'settings.ui_language': '🌐 Interface Language',
    'settings.interview_language': '🎙️ Interview Language',
    'settings.voice': '🎤 Interviewer Voice',
    'settings.voice_free': '🔒 Upgrade to Pro or Premium to change the interviewer voice',
    'settings.plan_free': 'Free plan — voice selection requires Pro or Premium',
    'settings.plan_paid': '{plan} plan — all voice options available',
    'settings.saved': 'Settings saved!',
    'settings.failed_load': 'Failed to load settings',
    'settings.failed_save': 'Failed to save',
    'settings.active': 'Active',
    'settings.start_interview': '🎯 Start Interview',
    'settings.lang_en': '🇬🇧 English',
    'settings.lang_ru': '🇷🇺 Русский',

    /* Subscriptions */
    'subs.title': 'Subscriptions',
    'subs.dashboard': 'Dashboard →',
    'subs.current_plan': 'Current Plan',
    'subs.available_plans': 'Available Plans',
    'subs.per_month': '/month',
    'subs.upgrade': 'Upgrade',
    'subs.current': 'Current',
    'subs.contact_admin': 'Contact support to change your plan',
    'subs.failed_load': 'Failed to load plans.',
    'subs.retry': 'Retry',

    /* Company page */
    'company.title': 'Company Link',
    'company.dashboard': 'Dashboard →',
    'company.description': 'Link a company by pasting a vacancy URL to get AI-generated interview context. Start a practice session tailored to that company.',
    'company.add_company': 'Add Company',
    'company.add_header': 'New Company',
    'company.name_placeholder': 'Company name *',
    'company.position_placeholder': 'Position *',
    'company.url_placeholder': 'Vacancy URL *',
    'company.cancel': 'Cancel',
    'company.save': 'Save',
    'company.create_failed': 'Failed to create company.',
    'company.delete_failed': 'Failed to delete company.',
    'company.failed_load': 'Failed to load companies.',
    'company.retry': 'Retry',
    'company.empty': 'No companies linked yet. Add one above!',
    'company.start_section': 'Select a linked company and start a tailored interview:',
    'company.select_company': 'Select a company…',
    'company.start_interview': '🎯 Start Interview',
    'company.start_failed': 'Failed to start interview. Try again.',
    'company.upgrade': '⭐ Upgrade to Premium',
    'company.premium_title': 'Premium Feature',
    'company.premium_desc': 'Company Link Interview is available for Premium subscribers only. Upgrade to link real vacancies and practice with tailored questions.',

    /* System Design */
    'sd.title': 'System Design Interview',
    'sd.desc': 'Practice designing scalable systems — architecture, trade-offs, scalability',
    'sd.select_problem': 'Select a system design problem',
    'sd.problem.0': 'Design YouTube',
    'sd.problem.1': 'Design Twitter',
    'sd.problem.2': 'Design URL Shortener',
    'sd.problem.3': 'Design WhatsApp/Chat System',
    'sd.problem.4': 'Design Uber',
    'sd.problem.5': 'Design Netflix',
    'sd.start_interview': '🏗️ Start System Design Interview',
    'sd.starting': 'Starting...',
    'sd.premium_title': 'Premium Feature',
    'sd.premium_desc': 'System Design interviews are available for Pro and Premium subscribers only. Upgrade your plan to practice with architecture questions used at FAANG companies.',
    'sd.upgrade': '⭐ Upgrade',
    'sd.back': '← Back',

    /* System Design Chat */
    'sd.chat_title': 'System Design',
    'sd.chat_input_placeholder': 'Type your answer...',
    'sd.chat_send': 'Send',
    'sd.chat_thinking': 'Thinking...',
    'sd.chat_error_submit': 'Failed to send. Try again.',
    'sd.your_answer': 'Your answer — Step {num}',
    'sd.evaluation_title': 'System Design Evaluation',
    'sd.evaluation_overall': 'Overall: {score}/10',
    'sd.step_of': 'Step {current} of {total}',
    'sd.feedback': 'Score: {score}/10',
    'sd.component_requirements': 'Requirements Clarity',
    'sd.component_estimations': 'Estimations',
    'sd.component_data_model': 'Data Model',
    'sd.component_api_design': 'API Design',
    'sd.component_architecture': 'Architecture',
    'sd.component_deep_dive': 'Deep Dive',
    'sd.component_tradeoffs': 'Trade-offs',
    'sd.strengths': '✅ Strengths',
    'sd.improvements': '📈 Areas to Improve',
    'sd.topics': '📚 Topics to Study',
    'sd.practice_again': 'Practice Again',
    'sd.view_profile': 'View Profile',

    /* History */
    'history.sd_empty': 'No System Design sessions yet. Start one from the System Design page!',

    /* Profile plan features */
    'plan.feature.0': '2 interviews per month',
    'plan.feature.1': 'Text-based feedback',
    'plan.feature.2': 'Basic interview questions',
    'plan.feature.3': 'Single role selection',
    'plan.pro.feature.0': 'Unlimited interviews',
    'plan.pro.feature.1': '🎤 Voice answers (Telegram)',
    'plan.pro.feature.2': '🔊 Listen to questions (Mini App)',
    'plan.pro.feature.3': 'Detailed AI feedback',
    'plan.pro.feature.4': 'All roles & specialties',
    'plan.pro.feature.5': 'Company-specific question sets',
    'plan.pro.feature.6': 'Progress tracking & analytics',
    'plan.premium.feature.0': 'Everything in Pro',
    'plan.premium.feature.1': 'System Design whiteboard',
    'plan.premium.feature.2': 'Priority AI (faster responses)',
    'plan.premium.feature.3': 'Resume feedback & analysis',
    'plan.premium.feature.4': 'Personalized study plan',
    'plan.premium.feature.5': 'Priority support',

    /* Behavioral mode */
    'behavioral.title': 'Behavioral',
    'behavioral.label': '🎭 Behavioral',
    'behavioral.desc': 'Practice behavioral questions using the STAR method',
    'behavioral.start': '🎭 Start Behavioral Interview',
    'behavioral.star.situation': 'S — Situation',
    'behavioral.star.task': 'T — Task',
    'behavioral.star.action': 'A — Action',
    'behavioral.star.result': 'R — Result',
    'behavioral.star.score': 'STAR Score: {score}/10',
    'behavioral.competency': '🎯 Competency',
    'behavioral.suggest_company': 'Tip: Pick a company to practice behavioral questions specific to their interview style',
    'technical.header': '💻 Technical — Question {num} of {total}',
    'behavioral.header': '🎭 Behavioral — Question {num} of {total}',
    'behavioral.star_analysis': '📋 STAR Breakdown',
    'behavioral.star_overall': '⭐ STAR Overall: {score}/10',
    'behavioral.competencies': '🎯 Key Competencies',
    'behavioral.mode_technical': 'Technical',
    'behavioral.mode_behavioral': 'Behavioral',
    'behavioral.premium_only': '🔒 Behavioral interviews are available for Pro and Premium subscribers only. Upgrade your plan to access this mode.',

    /* Study Plan */
    'study_plan.nav': 'Study Plan',
    'study_plan.title': 'Study Plan',
    'study_plan.create_title': 'Create Study Plan',
    'study_plan.my_plans': 'My Plans',
    'study_plan.filter_mode': 'Interview Mode',
    'study_plan.filter_all': 'All',
    'study_plan.filter_technical': 'Technical',
    'study_plan.filter_behavioral': 'Behavioral',
    'study_plan.filter_date_from': 'From',
    'study_plan.filter_date_to': 'To',
    'study_plan.duration': 'Duration',
    'study_plan.duration_3': '3 days',
    'study_plan.duration_5': '5 days',
    'study_plan.duration_7': '7 days',
    'study_plan.duration_14': '14 days',
    'study_plan.duration_30': '30 days',
    'study_plan.sessions_found': '{count} interview{s} found',
    'study_plan.generate': 'Generate Study Plan',
    'study_plan.generating': 'Generating your plan...',
    'study_plan.no_sessions': 'No interviews found. Try a wider date range or different mode.',
    'study_plan.no_plans': 'No study plans yet. Create your first one above!',
    'study_plan.error_generate': 'Failed to generate plan',
    'study_plan.error_load': 'Failed to load plans',
    'study_plan.retry': 'Retry',
    'study_plan.days_completed': '{done}/{total} days',
    'study_plan.day': 'Day {num}',
    'study_plan.toggle_done': '✓ Mark as done',
    'study_plan.toggle_undo': '↩ Undo',
    'study_plan.resources': 'Resources',
    'study_plan.estimated': '~{min} min',
    'study_plan.status_active': 'Active',
    'study_plan.status_paused': 'Paused',
    'study_plan.status_completed': 'Completed',
    'study_plan.start_plan': '▶ Start Plan',
    'study_plan.pause_plan': '⏸ Pause',
    'study_plan.complete_plan': '✓ Complete',
    'study_plan.premium_title': 'Premium Feature',
    'study_plan.premium_desc': 'Personalised study plans are available for Pro and Premium subscribers only. Upgrade your plan to get AI-generated learning plans based on your interview performance.',
    'study_plan.upgrade': '⭐ Upgrade',
    'study_plan.back': '← Plans',
    'study_plan.focus_areas': 'Focus Areas',
    'study_plan.plan_created': 'Study plan created!',
    'study_plan.view_plan': 'View Plan',
  },

  ru: {
    /* Sidebar */
    'nav.dashboard': 'Главная',
    'nav.start_interview': 'Начать интервью',
    'nav.profile': 'Профиль',
    'nav.history': 'История',
    'nav.settings': 'Настройки',
    'nav.subscriptions': 'Подписки',
    'nav.company': 'Привязка компании',
    'nav.system_design': 'System Design',
    'nav.resume_analysis': 'Анализ резюме',
    'nav.open_browser': 'откроется в браузере',
    'sidebar.footer': 'AI Interview Practice v1.0',

    /* Dashboard */
    'dashboard.welcome': '👋 С возвращением',
    'dashboard.ready': 'Готовы к сегодняшней практике?',
    'dashboard.current_plan': 'Текущий план',
    'dashboard.plan_free': '2 интервью / месяц',
    'dashboard.plan_pro': 'Безлимитные интервью',
    'dashboard.plan_premium': 'Всё включено',
    'dashboard.this_month': 'За месяц',
    'dashboard.completed': 'Завершено',
    'dashboard.avg_score': 'Средний балл',
    'dashboard.recent_sessions': 'Последние сессии',
    'dashboard.no_sessions': 'Ещё нет сессий. Начните своё первое интервью!',
    'dashboard.start_interview': '🎯 Начать интервью',
    'dashboard.of': 'из',
    'dashboard.in_progress': 'В процессе',
    'dashboard.failed_load': 'Ошибка загрузки.',
    'dashboard.retry': 'Повторить',
    'dashboard.upgrade_pro': '⭐ Улучшить до Pro',
    'dashboard.upgrade_premium': '⭐ Улучшить до Premium',

    /* Profile */
    'profile.my_profile': 'Мой профиль',
    'profile.dashboard': 'Главная →',
    'profile.sessions_completed': '{count} сессия завершена',
    'profile.getting_started': 'Начинающий',
    'profile.avg_score': '⭐ Средний балл: {score}',
    'profile.subscription': 'Подписка',
    'profile.upgrade_pro': '⭐ Улучшить до Pro',
    'profile.upgrade_premium': '⭐ Улучшить до Premium',
    'profile.start_new': '🎯 Начать новое интервью',
    'profile.view_history': '📋 История интервью',
    'profile.failed_load': 'Ошибка загрузки профиля.',
    'profile.retry': 'Повторить',
    'profile.user': 'Пользователь',

    /* History */
    'history.title': 'История',
    'history.dashboard': 'Главная →',
    'history.total': 'Всего',
    'history.completed': 'Завершено',
    'history.avg_score': 'Средний балл',
    'history.all_sessions': 'Мои интервью',
    'history.empty_text': 'Пока нет сессий.',
    'history.empty_hint': 'Начните первое интервью, чтобы увидеть результаты здесь.',
    'history.start_interview': 'Начать интервью',
    'history.in_progress': '● В процессе',
    'history.resume': 'Продолжить',
    'history.failed_load': 'Ошибка загрузки истории.',
    'history.retry': 'Повторить',

    /* StartScreen (Setup) */
    'setup.back_dashboard': '← Главная',
    'setup.title': 'AI Interview Practice',
    'setup.subtitle': '5 вопросов · Обратная связь в реальном времени',
    'setup.select_role': 'Выберите роль',
    'setup.select_level': 'Уровень опыта',
    'setup.or': 'или',
    'setup.upload_resume': '📄 Загрузить резюме (PDF)',
    'setup.reading_resume': 'Читаем резюме...',
    'setup.resume_analysis': '📋 Анализ резюме',
    'setup.confidence': '{pct}% уверенности',
    'setup.role_label': 'Роль:',
    'setup.level_label': 'Уровень:',
    'setup.stack_label': 'Стек:',
    'setup.start_resume': '✅ Начать интервью',
    'setup.starting': 'Запуск...',
    'setup.edit': '✏️ Изменить',
    'setup.failed_start': 'Не удалось начать. Попробуйте снова.',
    'setup.failed_parse': 'Не удалось определить роль или уровень из резюме. Выберите вручную.',
    'setup.failed_upload': 'Не удалось проанализировать резюме',
    'setup.start_interview': 'Начать интервью',

    /* Skills */
    'setup.other_roles': 'Другие роли',
    'setup.skills_label': 'Навыки (опционально)',
    'setup.skills_placeholder': 'JS, React',
    'setup.limit_reached': 'Вы использовали все {count} бесплатных интервью в этом месяце. Перейдите на тариф Pro или Premium для безлимитного доступа.',
    'setup.upgrade': '⭐ Улучшить тариф',

    /* InterviewFlow */
    'interview.load_error': 'Не удалось загрузить вопрос. Попробуйте снова.',
    'interview.submit_error': 'Не удалось отправить ответ.',
    'interview.next_error': 'Не удалось загрузить следующий вопрос.',
    'interview.go_profile': 'Перейти в профиль',

    /* QuestionCard */
    'qcard.placeholder': 'Введите ваш ответ здесь…',
    'qcard.recording_placeholder': 'Запись… ваш голос будет расшифрован автоматически',
    'qcard.transcribing': 'Расшифровка голоса…',
    'qcard.submit': 'Отправить ответ',
    'qcard.evaluating': 'Оцениваем…',

    /* EvaluationCard */
    'eval.title': 'Оценка',
    'eval.strengths': 'Сильные стороны',
    'eval.improvements': 'Что улучшить',
    'eval.tip': 'Совет: ',
    'eval.exit_title': 'Выйти из интервью?',
    'eval.exit_desc': 'Вы сможете продолжить это интервью позже из профиля.',
    'eval.cancel': 'Отмена',
    'eval.exit': 'Выйти',
    'eval.view_summary': 'Итоги',
    'eval.next_question': 'Следующий вопрос',

    /* SummaryView (in-progress) */
    'summary.in_progress': 'Интервью в процессе',
    'summary.history': '← История',
    'summary.progress': 'Прогресс',
    'summary.questions_answered': 'Отвеченные вопросы',
    'summary.continue': 'Продолжить интервью',
    'summary.go_home': 'На главную',
    'summary.failed_load': 'Не удалось загрузить сессию.',

    /* SummaryCard */
    'summary_card.title': 'Итоги сессии',
    'summary_card.your_answer': 'Ваш ответ',
    'summary_card.feedback': 'Обратная связь',
    'summary_card.key_strengths': 'Ключевые сильные стороны',
    'summary_card.areas_improve': 'Области для улучшения',
    'summary_card.topics_study': 'Темы для изучения',
    'summary_card.question_breakdown': 'Разбор вопросов',
    'summary_card.practice_again': 'Практиковаться снова',
    'summary_card.view_profile': 'Посмотреть профиль',

    /* Settings */
    'settings.title': 'Настройки',
    'settings.dashboard': 'Главная →',
    'settings.ui_language': '🌐 Язык интерфейса',
    'settings.interview_language': '🎙️ Язык интервью',
    'settings.voice': '🎤 Голос интервьюера',
    'settings.voice_free': '🔒 Улучшите до Pro или Premium, чтобы изменить голос интервьюера',
    'settings.plan_free': 'Бесплатный план — выбор голоса доступен в Pro или Premium',
    'settings.plan_paid': 'План {plan} — доступны все голоса',
    'settings.saved': 'Настройки сохранены!',
    'settings.failed_load': 'Не удалось загрузить настройки',
    'settings.failed_save': 'Не удалось сохранить',
    'settings.active': 'Активно',
    'settings.start_interview': '🎯 Начать интервью',
    'settings.lang_en': '🇬🇧 English',
    'settings.lang_ru': '🇷🇺 Русский',

    /* Subscriptions */
    'subs.title': 'Подписки',
    'subs.dashboard': 'Главная →',
    'subs.current_plan': 'Текущий тариф',
    'subs.available_plans': 'Доступные тарифы',
    'subs.per_month': '/мес',
    'subs.upgrade': 'Улучшить',
    'subs.current': 'Текущий',
    'subs.contact_admin': 'Свяжитесь с поддержкой для изменения тарифа',
    'subs.failed_load': 'Не удалось загрузить тарифы.',
    'subs.retry': 'Повторить',

    /* Company page */
    'company.title': 'Привязка компании',
    'company.dashboard': 'Главная →',
    'company.description': 'Привяжите компанию, вставив ссылку на вакансию, чтобы получить AI-контекст для интервью. Начните практику с вопросами под эту компанию.',
    'company.add_company': 'Добавить компанию',
    'company.add_header': 'Новая компания',
    'company.name_placeholder': 'Название компании *',
    'company.position_placeholder': 'Должность *',
    'company.url_placeholder': 'Ссылка на вакансию *',
    'company.cancel': 'Отмена',
    'company.save': 'Сохранить',
    'company.create_failed': 'Не удалось создать компанию.',
    'company.delete_failed': 'Не удалось удалить компанию.',
    'company.failed_load': 'Не удалось загрузить компании.',
    'company.retry': 'Повторить',
    'company.empty': 'Пока нет привязанных компаний. Добавьте первую!',
    'company.start_section': 'Выберите привязанную компанию и начните интервью:',
    'company.select_company': 'Выберите компанию…',
    'company.start_interview': '🎯 Начать интервью',
    'company.start_failed': 'Не удалось начать интервью. Попробуйте снова.',
    'company.upgrade': '⭐ Улучшить до Premium',
    'company.premium_title': 'Функция Premium',
    'company.premium_desc': 'Company Link Interview доступно только для подписчиков Premium. Улучшите план, чтобы привязывать реальные вакансии и практиковаться с адаптированными вопросами.',

    /* System Design */
    'sd.title': 'System Design интервью',
    'sd.desc': 'Практика проектирования масштабируемых систем — архитектура, компромиссы, масштабирование',
    'sd.select_problem': 'Выберите задачу System Design',
    'sd.problem.0': 'Спроектировать YouTube',
    'sd.problem.1': 'Спроектировать Twitter',
    'sd.problem.2': 'Спроектировать URL Shortener',
    'sd.problem.3': 'Спроектировать WhatsApp/Chat System',
    'sd.problem.4': 'Спроектировать Uber',
    'sd.problem.5': 'Спроектировать Netflix',
    'sd.start_interview': '🏗️ Начать System Design интервью',
    'sd.starting': 'Запуск...',
    'sd.premium_title': 'Функция Premium',
    'sd.premium_desc': 'System Design интервью доступно только для подписчиков Pro и Premium. Улучшите тариф, чтобы практиковаться с вопросами по архитектуре, которые задают в FAANG-компаниях.',
    'sd.upgrade': '⭐ Улучшить тариф',
    'sd.back': '← Назад',

    /* System Design Chat */
    'sd.chat_title': 'System Design',
    'sd.chat_input_placeholder': 'Введите ваш ответ...',
    'sd.chat_send': 'Отправить',
    'sd.chat_thinking': 'Думаю...',
    'sd.chat_error_submit': 'Ошибка отправки. Попробуйте снова.',
    'sd.your_answer': 'Ваш ответ — Шаг {num}',
    'sd.evaluation_title': 'Оценка System Design',
    'sd.evaluation_overall': 'Общий балл: {score}/10',
    'sd.step_of': 'Шаг {current} из {total}',
    'sd.feedback': 'Оценка: {score}/10',
    'sd.component_requirements': 'Чёткость требований',
    'sd.component_estimations': 'Оценки',
    'sd.component_data_model': 'Модель данных',
    'sd.component_api_design': 'API дизайн',
    'sd.component_architecture': 'Архитектура',
    'sd.component_deep_dive': 'Deep Dive',
    'sd.component_tradeoffs': 'Компромиссы',
    'sd.strengths': '✅ Сильные стороны',
    'sd.improvements': '📈 Что улучшить',
    'sd.topics': '📚 Темы для изучения',
    'sd.practice_again': 'Практиковаться снова',
    'sd.view_profile': 'Посмотреть профиль',

    /* History */
    'history.sd_empty': 'Пока нет System Design сессий. Начните со страницы System Design!',

    /* Profile plan features */
    'plan.feature.0': '2 интервью в месяц',
    'plan.feature.1': 'Текстовая обратная связь',
    'plan.feature.2': 'Базовые вопросы',
    'plan.feature.3': 'Одна роль',
    'plan.pro.feature.0': 'Безлимитные интервью',
    'plan.pro.feature.1': '🎤 Голосовые ответы (Telegram)',
    'plan.pro.feature.2': '🔊 Прослушивание вопросов (Mini App)',
    'plan.pro.feature.3': 'Детальная AI обратная связь',
    'plan.pro.feature.4': 'Все роли и специализации',
    'plan.pro.feature.5': 'Вопросы под конкретные компании',
    'plan.pro.feature.6': 'Отслеживание прогресса и аналитика',
    'plan.premium.feature.0': 'Всё, что в Pro',
    'plan.premium.feature.1': 'System Design доска',
    'plan.premium.feature.2': 'Приоритетный AI (быстрые ответы)',
    'plan.premium.feature.3': 'Анализ резюме',
    'plan.premium.feature.4': 'Персональный план обучения',
    'plan.premium.feature.5': 'Приоритетная поддержка',

    /* Behavioral mode */
    'behavioral.title': 'Поведенческое',
    'behavioral.label': '🎭 Behavioral',
    'behavioral.desc': 'Практика поведенческих вопросов по методике STAR',
    'behavioral.start': '🎭 Начать Behavioral интервью',
    'behavioral.star.situation': 'S — Ситуация',
    'behavioral.star.task': 'T — Задача',
    'behavioral.star.action': 'A — Действие',
    'behavioral.star.result': 'R — Результат',
    'behavioral.star.score': 'STAR оценка: {score}/10',
    'behavioral.competency': '🎯 Компетенция',
    'technical.header': '💻 Technical — Вопрос {num} из {total}',
    'behavioral.header': '🎭 Behavioral — Вопрос {num} из {total}',
    'behavioral.star_analysis': '📋 STAR Разбор',
    'behavioral.star_overall': '⭐ STAR Общий: {score}/10',
    'behavioral.competencies': '🎯 Ключевые компетенции',
    'behavioral.mode_technical': 'Technical',
    'behavioral.mode_behavioral': 'Behavioral',
    'behavioral.suggest_company': 'Совет: выберите компанию для практики вопросов под их стиль интервью',
    'behavioral.premium_only': '🔒 Behavioral интервью доступны только для подписчиков Pro и Premium. Улучшите свой план, чтобы получить доступ к этому режиму.',

    /* Study Plan */
    'study_plan.nav': 'План обучения',
    'study_plan.title': 'План обучения',
    'study_plan.create_title': 'Создать план',
    'study_plan.my_plans': 'Мои планы',
    'study_plan.filter_mode': 'Режим интервью',
    'study_plan.filter_all': 'Все',
    'study_plan.filter_technical': 'Technical',
    'study_plan.filter_behavioral': 'Behavioral',
    'study_plan.filter_date_from': 'От',
    'study_plan.filter_date_to': 'До',
    'study_plan.duration': 'Длительность',
    'study_plan.duration_3': '3 дня',
    'study_plan.duration_5': '5 дней',
    'study_plan.duration_7': '7 дней',
    'study_plan.duration_14': '14 дней',
    'study_plan.duration_30': '30 дней',
    'study_plan.sessions_found': 'Найдено {count} интервью',
    'study_plan.generate': 'Создать план обучения',
    'study_plan.generating': 'Генерируем план...',
    'study_plan.no_sessions': 'Интервью не найдены. Попробуйте другой период или режим.',
    'study_plan.no_plans': 'Планов пока нет. Создайте первый выше!',
    'study_plan.error_generate': 'Не удалось создать план',
    'study_plan.error_load': 'Не удалось загрузить планы',
    'study_plan.retry': 'Повторить',
    'study_plan.days_completed': '{done}/{total} дней',
    'study_plan.day': 'День {num}',
    'study_plan.toggle_done': '✓ Выполнено',
    'study_plan.toggle_undo': '↩ Отменить',
    'study_plan.resources': 'Ресурсы',
    'study_plan.estimated': '~{min} мин',
    'study_plan.status_active': 'Активен',
    'study_plan.status_paused': 'Пауза',
    'study_plan.status_completed': 'Завершён',
    'study_plan.start_plan': '▶ Начать',
    'study_plan.pause_plan': '⏸ Пауза',
    'study_plan.complete_plan': '✓ Завершить',
    'study_plan.premium_title': 'Функция Premium',
    'study_plan.premium_desc': 'Персональные планы обучения доступны только для подписчиков Pro и Premium. Улучшите тариф, чтобы получать AI-планы на основе ваших интервью.',
    'study_plan.upgrade': '⭐ Улучшить',
    'study_plan.back': '← Планы',
    'study_plan.focus_areas': 'Фокус-области',
    'study_plan.plan_created': 'План обучения создан!',
    'study_plan.view_plan': 'Посмотреть план',
  },
};

// ── Context ────────────────────────────────────────────────────────────────────

export type UILanguage = 'en' | 'ru';

interface I18nContextType {
  uiLang: UILanguage;
  setUiLang: (lang: UILanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  loading: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [uiLang, setUiLangState] = useState<UILanguage>('en');
  const [loading, setLoading] = useState(true);

  // Load UI language from server on mount, fallback to Telegram detection
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getSettings();
        const saved = data.ui_language as UILanguage | undefined;
        if ((saved === 'en' || saved === 'ru') && !cancelled) {
          setUiLangState(saved);
          setLoading(false);
          return;
        }
      } catch {
        // fallback to Telegram detection
      }

      // Detect from Telegram WebApp
      try {
        const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
        const tgLang = tg?.initDataUnsafe?.user?.language_code || '';
        if ((tgLang === 'ru' || tgLang === 'uk' || tgLang === 'be') && !cancelled) {
          setUiLangState('ru');
        }
      } catch {
        // ignore
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const setUiLang = useCallback(async (lang: UILanguage) => {
    setUiLangState(lang);
    // Save to server (optimistic)
    try {
      const current = await getSettings();
      await updateSettings(current.language || 'en', current.voice || 'alloy', lang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[uiLang];
      let template = dict?.[key] ?? key;

      if (!template || template === key) {
        // Fallback to English
        template = translations.en?.[key] ?? key;
      }

      if (!params) return template;

      let result = template;
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(`{${k}}`, String(v));
      }
      return result;
    },
    [uiLang],
  );

  const value: I18nContextType = { uiLang, setUiLang, t, loading };

  return React.createElement(I18nContext.Provider, { value }, children);
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return ctx;
}
