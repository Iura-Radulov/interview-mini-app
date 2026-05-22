'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTheme } from '@/lib/telegram';
import { startInterview } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';

const ROLES = [
  { id: 'Frontend', label: 'Frontend', emoji: '🖥️' },
  { id: 'Backend', label: 'Backend', emoji: '⚙️' },
  { id: 'Fullstack', label: 'Fullstack', emoji: '🔗' },
  { id: 'ML', label: 'ML / AI', emoji: '🤖' },
];

const LEVELS = ['Junior', 'Mid', 'Senior'];

export default function StartScreen() {
  const router = useRouter();
  const theme = getTheme();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!selectedRole || !selectedLevel) return;
    setLoading(true);
    setError(null);
    try {
      const result = await startInterview(selectedRole, selectedLevel);
      sessionStorage.setItem(
        `interview_${result.session_id}_q1`,
        JSON.stringify(result.question)
      );
      router.push(`/interview?session=${result.session_id}&q=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start. Try again.');
      setLoading(false);
    }
  }

  const canStart = !!selectedRole && !!selectedLevel && !loading;

  return (
    <div
      className="min-h-screen flex flex-col px-4 py-6 max-w-sm mx-auto"
      style={{ backgroundColor: theme.bg_color, color: theme.text_color }}
    >
      <div className="flex-1">
        <div className="text-center mb-8 mt-4">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold mb-1">AI Interview Practice</h1>
          <p className="text-sm" style={{ color: theme.hint_color }}>
            5 questions · Real-time feedback
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: theme.hint_color }}>
            Select Role
          </p>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95"
                  style={{
                    borderColor: isSelected ? theme.button_color : `${theme.hint_color}44`,
                    backgroundColor: isSelected ? `${theme.button_color}15` : theme.secondary_bg_color,
                    color: isSelected ? theme.button_color : theme.text_color,
                  }}
                >
                  <span className="text-2xl mb-1">{role.emoji}</span>
                  <span className="text-sm font-medium">{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: theme.hint_color }}>
            Experience Level
          </p>
          <div className="flex gap-3">
            {LEVELS.map((level) => {
              const isSelected = selectedLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className="flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 active:scale-95"
                  style={{
                    borderColor: isSelected ? theme.button_color : `${theme.hint_color}44`,
                    backgroundColor: isSelected ? theme.button_color : 'transparent',
                    color: isSelected ? theme.button_text_color : theme.text_color,
                  }}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-xl text-sm text-center"
            style={{ backgroundColor: '#ff444420', color: '#ff4444' }}
          >
            {error}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
          style={{
            backgroundColor: canStart ? theme.button_color : `${theme.hint_color}44`,
            color: canStart ? theme.button_text_color : theme.hint_color,
            cursor: canStart ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" color={theme.button_text_color} />
              <span>Starting...</span>
            </>
          ) : (
            'Start Interview'
          )}
        </button>

        <Link
          href="/profile"
          className="block w-full py-3 text-center rounded-2xl text-sm font-medium transition-colors"
          style={{ color: theme.button_color }}
        >
          My Profile
        </Link>
      </div>
    </div>
  );
}
