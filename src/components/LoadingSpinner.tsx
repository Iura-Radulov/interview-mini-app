'use client';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function LoadingSpinner({ size = 'md', color }: Props) {
  const sizeMap = { sm: 16, md: 32, lg: 48 };
  const px = sizeMap[size];

  return (
    <div
      style={{
        width: px,
        height: px,
        borderWidth: px / 8,
        borderColor: color ? `${color}33` : '#2678b633',
        borderTopColor: color ?? '#2678b6',
      }}
      className="rounded-full border-solid animate-spin"
    />
  );
}
