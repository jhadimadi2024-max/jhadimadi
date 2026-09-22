import React, { useState, useRef } from 'react';
import { ShoppingCart, Search, Sparkles, Mic, User, Bell } from 'lucide-react';

export interface HeaderProps {
  currentUser?: any;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenMemberModal?: () => void;
  onOpenProfile?: () => void;
  onOpenAiAssistant?: () => void;
  onNavigateToAdmin?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: () => void;
  lang?: string;
  onLogoClick?: () => void;
  district?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  cartCount = 0,
  onOpenCart,
  onOpenMemberModal,
  onOpenProfile,
  onOpenAiAssistant,
  onNavigateToAdmin,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  lang = 'bn',
  onLogoClick,
  district = 'Khagrachari',
}) => {
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header
      className="site-header main-header app-edge-to-edge-header relative z-40 w-full bg-transparent text-slate-800 m-0 p-0"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        backgroundColor: 'transparent',
      }}
    >
      <div className="w-full px-2 sm:px-4 py-1.5 sm:py-2">
        <div 
          className="max-w-7xl mx-auto border border-emerald-600 rounded-xl px-2.5 sm:px-3 py-1.5 flex items-center justify-between gap-2 sm:gap-3 bg-[#faf9f6] shadow-xs"
          style={{ backgroundColor: '#faf9f6' }}
        >
          {/* LEFT: Official Brand Logo & Identity */}
          <div
            onClick={onLogoClick}
            className="flex items-center cursor-pointer select-none group min-w-0"
            title="Jhadimadi.com হোমপেজ"
          >
            <div className="relative p-0.5 rounded-lg border border-emerald-600 bg-transparent shadow-xs group-hover:scale-105 transition-transform mr-1.5 shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
              <img
                src="https://i.ibb.co.com/sppWZhc9/logo33.png"
                alt="Jhadimadi.com Logo"
                className="h-5 sm:h-6 w-auto object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo11.png';
                }}
              />
            </div>

            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[14px] sm:text-[17px] font-black tracking-tight text-[#b20606] font-sans leading-none truncate">
                Jhadimadi<span className="text-[#065f46]">.com</span>
              </span>
              <span className="text-[8.5px] sm:text-[10px] font-bold text-[#065f46] tracking-tight leading-none mt-0.5 truncate">
                ঝাদিমাদি ডটকম • পার্বত্য ই-কমার্স
              </span>
            </div>
          </div>

          {/* RIGHT: Actions (Profile & Cart) with transparent background and sharp green border */}
          <div className="flex items-center gap-1.5 shrink-0">
            {currentUser && onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="h-7 px-2.5 rounded-lg bg-transparent hover:bg-emerald-50/50 active:scale-95 border border-emerald-600 text-[#16a34a] transition-all text-[9.5px] font-black flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="প্রোফাইল ড্যাশবোর্ড"
              >
                <User className="w-3.5 h-3.5 text-[#16a34a]" />
                <span className="max-w-[50px] truncate">{currentUser.name?.split(' ')[0] || 'প্রোফাইল'}</span>
              </button>
            )}

            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className="h-7 w-7 sm:h-7.5 sm:w-7.5 rounded-lg bg-transparent hover:bg-emerald-50/50 active:scale-90 border border-emerald-600 text-[#16a34a] transition-all relative cursor-pointer shadow-2xs flex items-center justify-center"
                title="কার্ট"
                aria-label="শপিং কার্ট"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#16a34a]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[7.5px] font-black min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center shadow-xs border border-white leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
