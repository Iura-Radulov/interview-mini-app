'use client';

interface Props {
  current: number;
  total: number;
  buttonColor?: string;
  textColor?: string;
  hintColor?: string;
}

export default function ProgressBar({
  current,
  total,
  buttonColor = '#2678b6',
  textColor = '#000000',
  hintColor = '#999999',
}: Props) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="w-full px-4 py-3">
      <div className="flex justify-between mb-1 text-sm font-medium" style={{ color: textColor }}>
        <span>Question {current} of {total}</span>
        <span style={{ color: hintColor }}>{pct}%</span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 6, backgroundColor: `${buttonColor}33` }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: buttonColor }}
        />
      </div>
    </div>
  );
}
