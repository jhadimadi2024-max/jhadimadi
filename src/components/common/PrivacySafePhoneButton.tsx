import React from 'react';
import { Phone, PhoneCall } from 'lucide-react';
import { triggerClickToCall } from '../../utils/privacyUtils';

export interface PrivacySafePhoneButtonProps {
  /** The real phone number to be called securely in the background */
  phoneNumber?: string;
  /** Custom label text (defaults to 'যোগাযোগ করুন' / 'Contact / Call') */
  label?: string;
  /** UI Color Theme Variant */
  variant?: 'emerald' | 'rose' | 'black' | 'purple' | 'slate' | 'outline';
  /** Size modifier */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Custom class overrides */
  className?: string;
  /** Custom icon override */
  icon?: React.ReactNode;
  /** Whether to stop event propagation when clicked inside a clickable card */
  stopPropagation?: boolean;
  /** Language preference */
  lang?: 'bn' | 'en';
  /** Optional callback before dialer launch */
  onBeforeCall?: () => void;
  /** Fallback if phone is missing */
  onMissingPhone?: () => void;
  /** Custom title attribute */
  title?: string;
  /** Unique ID for testing and accessibility */
  id?: string;
}

export const PrivacySafePhoneButton: React.FC<PrivacySafePhoneButtonProps> = ({
  phoneNumber,
  label,
  variant = 'emerald',
  size = 'md',
  className = '',
  icon,
  stopPropagation = true,
  lang = 'bn',
  onBeforeCall,
  onMissingPhone,
  title,
  id
}) => {
  const isBn = lang === 'bn';
  const defaultLabel = isBn ? 'যোগাযোগ করুন' : 'Contact / Call';
  const displayLabel = label || defaultLabel;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    if (onBeforeCall) {
      onBeforeCall();
    }
    if (!phoneNumber) {
      if (onMissingPhone) {
        onMissingPhone();
      } else {
        alert(isBn ? 'যোগাযোগ নম্বর পাওয়া যায়নি।' : 'Contact number unavailable.');
      }
      return;
    }
    triggerClickToCall(phoneNumber, onMissingPhone);
  };

  // Base styling per variant
  const variantStyles = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-2xs',
    rose: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-2xs',
    black: 'bg-black hover:bg-stone-900 active:bg-stone-800 text-white shadow-2xs',
    purple: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-2xs',
    slate: 'bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white shadow-2xs',
    outline: 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs'
  };

  // Size styling
  const sizeStyles = {
    xs: 'text-[8.5px] py-1 px-2.5 rounded-lg gap-1 font-bold',
    sm: 'text-[10px] py-1.5 px-3 rounded-xl gap-1.5 font-bold',
    md: 'text-xs py-2.5 px-3.5 rounded-xl gap-2 font-black',
    lg: 'text-sm py-3 px-4 rounded-xl gap-2 font-black'
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <button
      id={id}
      type="button"
      onClick={handleClick}
      aria-label={displayLabel}
      title={title || displayLabel}
      className={`inline-flex items-center justify-center transition-all duration-150 active:scale-[0.98] select-none cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon !== undefined ? (
        icon
      ) : size === 'lg' || size === 'md' ? (
        <PhoneCall className={`${iconSizes[size]} shrink-0`} />
      ) : (
        <Phone className={`${iconSizes[size]} shrink-0`} />
      )}
      <span className="truncate">{displayLabel}</span>
    </button>
  );
};

export default PrivacySafePhoneButton;
