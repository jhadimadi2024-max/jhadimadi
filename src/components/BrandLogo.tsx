import React from 'react';

interface BrandLogoProps {
  variant?: 'icon-only' | 'full-horizontal' | 'full-stacked' | 'header-badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  theme?: 'light' | 'dark' | 'on-emerald';
  showSlogan?: boolean;
}

/**
 * Jhadimadi.com Official Brand Logo Component
 * Incorporates the Red Runner Courier icon and authentic brand typography
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full-horizontal',
  size = 'md',
  className = '',
  theme = 'light',
  showSlogan = true,
}) => {
  // Official immutable Red Runner logo image source with local and CDN redundancy
  const runnerImgSrc = "/runner-logo-hires.png";
  const runnerFallbackSrc = "/runner-logo.png";

  const sizeStyles = {
    sm: {
      icon: 'w-6 h-6',
      title: 'text-xs',
      bnText: 'text-[8px]',
      slogan: 'text-[6.5px]',
      container: 'gap-1.5',
    },
    md: {
      icon: 'w-8 h-8',
      title: 'text-sm',
      bnText: 'text-[9.5px]',
      slogan: 'text-[7.5px]',
      container: 'gap-2',
    },
    lg: {
      icon: 'w-12 h-12',
      title: 'text-lg',
      bnText: 'text-xs',
      slogan: 'text-[9px]',
      container: 'gap-2.5',
    },
    xl: {
      icon: 'w-20 h-20 sm:w-24 sm:h-24',
      title: 'text-2xl sm:text-3xl',
      bnText: 'text-sm sm:text-base',
      slogan: 'text-[10px] sm:text-xs',
      container: 'gap-3 sm:gap-4',
    },
  };

  const currentSize = sizeStyles[size];

  // Official Red Runner Figure - Immutable Brand Icon
  const RunnerIconGraphic = (
    <div className={`relative ${currentSize.icon} shrink-0 flex items-center justify-center`}>
      <img
        src={runnerImgSrc}
        alt="Jhadimadi Red Runner Icon"
        className="w-full h-full object-contain select-none pointer-events-none"
        onError={(e) => {
          if ((e.currentTarget as HTMLImageElement).src !== runnerFallbackSrc) {
            (e.currentTarget as HTMLImageElement).src = runnerFallbackSrc;
          }
        }}
      />
    </div>
  );

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {RunnerIconGraphic}
      </div>
    );
  }

  if (variant === 'header-badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 cursor-pointer select-none group ${className}`}>
        <div className="relative p-0.5 rounded-lg bg-white shadow-xs border border-white/40 group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center w-7 h-7">
          <img
            src={runnerImgSrc}
            alt="Jhadimadi Runner"
            className="w-6 h-6 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/runner-logo.png";
            }}
          />
        </div>
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-0.5">
            <span className="text-[11px] font-black tracking-wider text-white">JHADIMADI</span>
            <span className="text-[9px] font-black text-amber-300">.COM</span>
          </div>
          <span className="text-[6.5px] text-emerald-100 font-bold tracking-tight mt-0.5">
            INTEGRITY IS OUR CAPITAL
          </span>
        </div>
      </div>
    );
  }

  // Full stacked or Full horizontal representation
  const isStacked = variant === 'full-stacked';
  const textColor = theme === 'on-emerald' ? 'text-white' : 'text-red-700';
  const subTextColor = theme === 'on-emerald' ? 'text-amber-300' : 'text-[#8B1A1A]';
  const sloganColor = theme === 'on-emerald' ? 'text-emerald-100' : 'text-stone-700';

  return (
    <div
      className={`inline-flex ${isStacked ? 'flex-col items-center text-center' : 'items-center text-left'} ${currentSize.container} ${className}`}
    >
      {RunnerIconGraphic}
      <div className={`flex flex-col ${isStacked ? 'items-center' : 'items-start'} leading-tight`}>
        <span className={`${currentSize.bnText} font-bold text-red-600 tracking-wide font-sans`}>
          ঝাদিমাদি ডটকম
        </span>
        <div className="flex items-baseline">
          <span className={`${currentSize.title} font-black tracking-tight ${textColor} uppercase font-sans`}>
            JHADIMADI
          </span>
          <span className={`${currentSize.title} font-black ${subTextColor} uppercase`}>
            .COM
          </span>
        </div>
        {showSlogan && (
          <span className={`${currentSize.slogan} font-extrabold tracking-widest uppercase ${sloganColor} mt-0.5`}>
            INTEGRITY IS OUR CAPITAL
          </span>
        )}
      </div>
    </div>
  );
};
