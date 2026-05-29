'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Question, InterviewMode } from '@/types';
import { getTheme } from '@/lib/telegram';
import { textToSpeech, transcribeAudio } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  question: Question;
  onSubmit: (answer: string, timeTakenSeconds?: number) => void;
  onVoiceSubmit?: (audioBlob: Blob, timeTakenSeconds?: number) => Promise<void>;
  loading: boolean;
  mode?: InterviewMode;
}

const MAX_CHARS = 2000;

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

const COMPETENCY_COLORS: Record<string, string> = {
  'Leadership': '#8b5cf6',
  'Conflict Resolution': '#ef4444',
  'Communication': '#3b82f6',
  'Problem Solving': '#f59e0b',
  'Teamwork': '#10b981',
  'Adaptability': '#ec4899',
  'Ownership': '#6366f1',
  'Growth Mindset': '#14b8a6',
};

const COMPETENCY_ICONS: Record<string, string> = {
  'Leadership': '👥',
  'Conflict Resolution': '🤝',
  'Communication': '💬',
  'Problem Solving': '🧩',
  'Teamwork': '🤲',
  'Adaptability': '🔄',
  'Ownership': '🎯',
  'Growth Mindset': '🌱',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QuestionCard({ question, onSubmit, onVoiceSubmit, loading, mode = 'technical' }: Props) {
  const { t } = useTranslation();
  const theme = getTheme();
  const [answer, setAnswer] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice recording state
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Voice answer recording (Pro+ direct submit)
  const [voiceAnswerRecording, setVoiceAnswerRecording] = useState(false);
  const [voiceAnswerTranscribing, setVoiceAnswerTranscribing] = useState(false);
  const vaRecorderRef = useRef<MediaRecorder | null>(null);
  const vaChunksRef = useRef<Blob[]>([]);

  // Timing tracking
  const questionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    setAnswer('');
    textareaRef.current?.focus();
    // Reset timer when question changes
    questionStartRef.current = Date.now();
    // Cleanup recording on question change
    stopRecording();
    stopVoiceAnswerRecording();
  }, [question]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [answer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  async function handleListen() {
    if (audioPlaying) {
      audioRef.current?.pause();
      audioRef.current = null;
      setAudioPlaying(false);
      return;
    }

    setAudioLoading(true);
    try {
      const b64 = await textToSpeech(question.question);
      if (!b64) return;

      const byteChars = atob(b64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNums[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNums);
      const blob = new Blob([byteArray], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        setAudioPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setAudioPlaying(false);
        audioRef.current = null;
      };

      await audio.play();
      setAudioPlaying(true);
    } catch {
      // ignore
    } finally {
      setAudioLoading(false);
    }
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
    setRecordingTime(0);
  }, []);

  async function handleStartRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 100) return; // Too short

        setTranscribing(true);
        try {
          const text = await transcribeAudio(blob);
          if (text) {
            setAnswer((prev) => {
              const separator = prev.trim() ? ' ' : '';
              return prev + separator + text;
            });
          }
        } finally {
          setTranscribing(false);
        }
      };

      chunksRef.current = [];
      mediaRecorder.start(250); // Collect chunks every 250ms
      setRecording(true);
      setRecordingTime(0);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 200);
    } catch {
      // Microphone permission denied or unavailable
    }
  }

  function handleToggleRecord() {
    if (recording) {
      stopRecording();
    } else {
      handleStartRecording();
    }
  }

  // ── Voice Answer (Pro+, direct API submit) ────────────────────────────

  const stopVoiceAnswerRecording = useCallback(() => {
    if (vaRecorderRef.current && vaRecorderRef.current.state !== 'inactive') {
      vaRecorderRef.current.stop();
    }
    setVoiceAnswerRecording(false);
  }, []);

  async function handleStartVoiceAnswer() {
    if (!onVoiceSubmit) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      vaRecorderRef.current = mediaRecorder;
      vaChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) vaChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(vaChunksRef.current, { type: 'audio/webm' });
        if (blob.size < 100) return;
        setVoiceAnswerTranscribing(true);
        const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
        try {
          // Pass blob with timing via a custom wrapper
          // The voice answer API endpoint accepts time_taken_seconds
          await onVoiceSubmit(blob, elapsed);
        } finally {
          setVoiceAnswerTranscribing(false);
        }
      };

      vaChunksRef.current = [];
      mediaRecorder.start(250);
      setVoiceAnswerRecording(true);
    } catch {
      // Mic permission denied
    }
  }

  function handleToggleVoiceAnswer() {
    if (voiceAnswerRecording) {
      stopVoiceAnswerRecording();
    } else {
      handleStartVoiceAnswer();
    }
  }

  function handleSubmit() {
    if (!answer.trim() || loading) return;
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    onSubmit(answer.trim(), elapsed);
  }

  const diffColor = DIFFICULTY_COLORS[question.difficulty?.toLowerCase()] ?? '#2678b6';
  const isBehavioral = mode === 'behavioral' || question.mode === 'behavioral';
  const compColor = isBehavioral && question.category
    ? COMPETENCY_COLORS[question.category] ?? '#8b5cf6'
    : null;
  const compIcon = isBehavioral && question.category
    ? COMPETENCY_ICONS[question.category] ?? '📌'
    : null;
  const remaining = MAX_CHARS - answer.length;
  const canSubmit = answer.trim().length > 0 && !loading;

  return (
    <div
      className="flex flex-col gap-4 px-4 py-4"
      style={{ color: theme.text_color }}
    >
      <div className="flex flex-wrap gap-2 items-center">
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: compColor ? `${compColor}20` : `${theme.button_color}20`,
            color: compColor ?? theme.button_color,
          }}
        >
          {compIcon ? `${compIcon} ${question.category}` : question.category}
        </span>
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
          style={{ backgroundColor: `${diffColor}20`, color: diffColor }}
        >
          {question.difficulty}
        </span>

        <div className="ml-auto flex gap-1.5">
          {/* 🔊 Listen button */}
          <button
            onClick={handleListen}
            disabled={audioLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-90"
            style={{
              backgroundColor: audioPlaying ? '#22c55e20' : `${theme.button_color}15`,
              color: audioPlaying ? '#22c55e' : theme.button_color,
            }}
          >
            {audioLoading ? (
              <LoadingSpinner size="sm" color={theme.button_color} />
            ) : audioPlaying ? (
              <>🔊 ⏹</>
            ) : (
              <>🔊</>
            )}
          </button>

          {/* 🎙️ Record button */}
          <button
            onClick={handleToggleRecord}
            disabled={transcribing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-90"
            style={{
              backgroundColor: recording ? '#ef444420' : `${theme.button_color}15`,
              color: recording ? '#ef4444' : theme.button_color,
            }}
          >
            {transcribing ? (
              <LoadingSpinner size="sm" color={theme.button_color} />
            ) : recording ? (
              <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> ⏹ {formatTime(recordingTime)}</>
            ) : (
              <>🎙️</>
            )}
          </button>
        </div>
      </div>

      <div
        className="p-4 rounded-2xl text-base leading-relaxed select-text"
        style={{ backgroundColor: theme.secondary_bg_color }}
      >
        {question.question}
      </div>

      <div>
        <textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value.slice(0, MAX_CHARS))}
          placeholder={
            recording
              ? t('qcard.recording_placeholder')
              : t('qcard.placeholder')
          }
          rows={4}
          className="w-full rounded-2xl p-4 text-sm resize-none outline-none border-2 transition-colors focus:border-opacity-100 min-h-[120px]"
          style={{
            backgroundColor: theme.secondary_bg_color,
            color: theme.text_color,
            borderColor: recording
              ? '#ef4444'
              : answer.length > 0
                ? theme.button_color
                : `${theme.hint_color}44`,
          }}
          disabled={loading}
        />
        {transcribing && (
          <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: theme.hint_color }}>
            <LoadingSpinner size="sm" color={theme.hint_color} />
            {t('qcard.transcribing')}
          </div>
        )}
        <div
          className="text-right text-xs mt-1 pr-1"
          style={{ color: remaining < 100 ? '#ef4444' : theme.hint_color }}
        >
          {remaining} / {MAX_CHARS}
        </div>
      </div>

      {/* 🎤 Voice Answer button — Pro+ only */}
      {onVoiceSubmit && (
        <button
          onClick={handleToggleVoiceAnswer}
          disabled={voiceAnswerTranscribing}
          className="w-full py-3 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
          style={{
            backgroundColor: voiceAnswerRecording ? '#ef444420' : `${theme.button_color}12`,
            color: voiceAnswerRecording ? '#ef4444' : theme.button_color,
            cursor: voiceAnswerTranscribing ? 'not-allowed' : 'pointer',
          }}
        >
          {voiceAnswerTranscribing ? (
            <>
              <LoadingSpinner size="sm" color={theme.button_color} />
              <span>Transcribing…</span>
            </>
          ) : voiceAnswerRecording ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Recording… tap to stop</span>
            </>
          ) : (
            <>
              <span>🎤</span>
              <span>Voice Answer</span>
            </>
          )}
        </button>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
        style={{
          backgroundColor: canSubmit ? theme.button_color : `${theme.hint_color}44`,
          color: canSubmit ? theme.button_text_color : theme.hint_color,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" color={theme.button_text_color} />
            <span>{t('qcard.evaluating')}</span>
          </>
        ) : (
          t('qcard.submit')
        )}
      </button>
    </div>
  );
}
