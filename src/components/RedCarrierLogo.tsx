import React from 'react';

interface RedCarrierLogoProps {
  size?: number | string;
  className?: string;
  color?: string;
}

export const RedCarrierLogo: React.FC<RedCarrierLogoProps> = ({
  size = 36,
  className = '',
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <div
      style={{ width: pixelSize, height: pixelSize }}
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      aria-label="Jhadimadi.com Red Runner Icon"
    >
      <img
        src="/runner-logo-hires.png"
        alt="Jhadimadi.com Red Runner"
        className="w-full h-full object-contain select-none pointer-events-none"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/runner-logo.png';
        }}
      />
    </div>
  );
};

