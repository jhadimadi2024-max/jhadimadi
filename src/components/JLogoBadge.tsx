import React from 'react';
import { RedCarrierLogo } from './RedCarrierLogo';

interface JLogoBadgeProps {
  className?: string;
  size?: number;
  color?: string;
}

export const JLogoBadge: React.FC<JLogoBadgeProps> = ({
  className = '',
  size = 40,
  color = '#B80000',
}) => {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
      }}
      className={`flex items-center justify-center select-none shrink-0 transition-transform ${className}`}
      id="jhadimadi-logo-badge"
    >
      <RedCarrierLogo size={size} color={color} />
    </div>
  );
};

