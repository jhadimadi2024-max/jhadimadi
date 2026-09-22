import React from 'react';

interface RunnerIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const RunnerIcon: React.FC<RunnerIconProps> = ({
  className = '',
  size = 40,
  color = '#B80000',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain', display: 'block' }}
    >
      {/* Head */}
      <circle cx="58.7" cy="31.5" r="7.8" />

      {/* Sack / Load on back */}
      <path d="M51.5,31.8 C48.5,29.2 42.5,28.5 35.5,29.8 C29.5,31.2 27.8,36.5 28.5,41.2 C29.6,46.5 35.2,49.2 43.5,48.5 C48.2,47.8 51.5,42.5 51.5,31.8 Z" />

      {/* Shoulder strap & Torso */}
      <path d="M51.2,32.2 C52.8,37.5 52.2,43.2 48.6,46.6 C51.6,47.2 54.5,44.6 56.2,40.5 C57.5,37.2 56.8,33.5 51.2,32.2 Z" />

      {/* Sash / Loop across Chest */}
      <path d="M48.2,39.5 C47.6,44.2 44.8,47.6 41.5,49.8 C43.6,51.0 46.5,50.6 49.2,48.0 C51.6,45.2 52.2,41.8 48.2,39.5 Z" />

      {/* Forward Arm & Thrust */}
      <path d="M53.8,40.5 L67.0,46.5 L57.8,55.2 L52.8,48.2 Z" />

      {/* Trailing Back Leg / Stride (Lower Left) */}
      <path d="M38.5,51.8 C34.5,57.5 30.2,64.8 24.8,70.5 L22.8,75.2 L28.2,74.5 L36.8,65.2 C40.5,60.8 43.5,55.8 45.2,51.2 Z" />

      {/* Front Bent Leg / Knee Forward (Lower Right) */}
      <path d="M44.5,55.2 C46.5,58.8 48.5,62.8 46.8,66.8 L44.5,70.5 L48.8,68.8 L51.8,62.5 C52.8,58.2 51.2,54.8 48.8,52.8 Z" />
    </svg>
  );
};
