import React from 'react';
import { Languages, MessageSquare, ShoppingCart, User, ArrowLeft, Home, Search, Grid, Bot, PlusCircle, Sparkles, MoreVertical } from 'lucide-react';
import { Language, UserProfile } from '../types';

export interface NavbarProps {
  lang?: Language | 'bn' | 'en';
  setLang?: (lang: Language) => void;
  currentUser?: UserProfile | any;
  onLogoClick?: () => void;
  onOpenWhatsAppChat?: () => void;
  whatsappUnreadCount?: number;
  unreadNotificationsCount?: number;
  onOpenProfile?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  onOpenCart?: () => void;
  cartCount?: number;
  showBack?: boolean;
  onBack?: () => void;
  searchCameraInputRef?: React.RefObject<HTMLInputElement>;
  handleImageUploaded?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowToast?: (msg: string) => void;
  activeTab?: string;
  onNavigateTab?: (tab: string) => void;
  onOpenAiChat?: () => void;
  onPostClick?: () => void;
  onToggleHamburger?: () => void;
  isAdminPreview?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang = 'bn',
  setLang,
  currentUser,
  onLogoClick,
  onOpenWhatsAppChat,
  whatsappUnreadCount = 0,
  unreadNotificationsCount = 0,
  onOpenProfile,
  onOpenAuth,
  onOpenCart,
  cartCount = 0,
  showBack = false,
  onBack,
  searchCameraInputRef,
  handleImageUploaded,
  setShowToast,
  activeTab = 'home',
  onNavigateTab,
  onOpenAiChat,
  onPostClick,
  onToggleHamburger,
  isAdminPreview = false
}) => {
  const isEn = lang === 'en';
  const isHomePage = activeTab === 'home' && !showBack;
  const totalNotifications = (whatsappUnreadCount || 0) + (unreadNotificationsCount || 0);

  const handleLangToggle = () => {
    if (!setLang) return;
    const nextLang: Language = lang === 'bn' ? 'en' : 'bn';
    setLang(nextLang);
    if (setShowToast) {
      setShowToast(nextLang === 'bn' ? 'ভাষা বাংলায় পরিবর্তিত হয়েছে' : 'Language switched to English');
      setTimeout(() => setShowToast(''), 2000);
    }
  };

  return (
    <header 
      className="site-header main-header app-edge-to-edge-header shrink-0 w-full bg-transparent text-slate-800 m-0 p-0 z-40 relative transition-all"
      style={{
        backgroundColor: 'transparent',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        paddingBottom: '0px',
      }}
      id="site-top-navbar"
    >
      {/* Hidden Camera Input for Image Search */}
      {searchCameraInputRef && handleImageUploaded && (
        <input 
          type="file" 
          accept="image/*" 
          ref={searchCameraInputRef} 
          onChange={handleImageUploaded} 
          className="hidden" 
          id="navbar-search-camera-input"
        />
      )}

      {/* Top Header Bar Container Box: Solid Off-White Fill inside Green Outline Border */}
      <div className={`w-full ${isAdminPreview ? 'px-1 py-1' : 'px-1.5 sm:px-3 py-1 sm:py-1.5'}`}>
        {/* Universal Top Header Container across ALL pages */}
        <div 
          className={`w-full max-w-7xl mx-auto border border-[#065f46] rounded-xl ${isAdminPreview ? 'px-1.5 py-1 gap-1' : 'px-1.5 sm:px-2.5 py-1 sm:py-1.5 gap-2'} flex flex-row items-center justify-between bg-[#faf9f6] shadow-xs flex-nowrap min-w-0`}
          style={{ backgroundColor: '#faf9f6' }}
        >
          {/* Left Side: Brand Identity with Runner Logo (Far-Left Aligned) */}
          <div className="flex flex-row items-center gap-1 sm:gap-1.5 shrink-0">
            {showBack && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-7 sm:w-8 h-8 sm:h-9 rounded-lg bg-white hover:bg-emerald-50/70 active:scale-95 text-[#065f46] transition flex items-center justify-center border border-[#065f46] shadow-2xs cursor-pointer mr-0.5 shrink-0"
                title={isEn ? 'Back' : 'পেছনে যান'}
                id="btn-navbar-back"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#065f46]" />
              </button>
            )}

            {/* Three-Dot Menu: Visible ONLY on Home Page, absolute left side, completely without box or green outline */}
            {isHomePage && onToggleHamburger && (
              <button
                type="button"
                onClick={onToggleHamburger}
                className="p-1 -ml-0.5 text-[#065f46] hover:text-emerald-800 active:scale-90 flex items-center justify-center shrink-0 cursor-pointer transition-colors bg-transparent border-0 shadow-none outline-hidden"
                aria-label={isEn ? 'Open navigation menu' : 'নেভিগেশন মেনু খুলুন'}
                title={isEn ? 'Menu & Policy' : 'মেনু ও নীতিমালা'}
                id="btn-navbar-three-dots"
              >
                <MoreVertical className={`${isAdminPreview ? 'w-4 h-4' : 'w-5 h-5 sm:w-5.5 sm:h-5.5'} text-[#065f46]`} strokeWidth={2.5} />
              </button>
            )}

            {/* Brand Logo & Title: Positioned & fitted neatly right next to the three-dot icon */}
            <div 
              onClick={onLogoClick}
              className="flex items-center gap-1 sm:gap-1.5 cursor-pointer select-none group shrink-0 min-w-0"
              title="Jhadimadi.com"
              id="navbar-brand-logo-trigger"
            >
              <div 
                className={`relative ${isAdminPreview ? 'p-0.5 rounded-md w-7 h-7' : 'p-1 rounded-lg w-8 h-8 sm:w-9 sm:h-9'} bg-white shadow-2xs border border-[#065f46] group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center`}
                style={{ backgroundColor: '#ffffff' }}
              >
                <img 
                  src="https://i.ibb.co.com/sppWZhc9/logo33.png"
                  alt="Jhadimadi Runner"
                  className={`${isAdminPreview ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} object-contain select-none pointer-events-none`}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/runner-logo.png";
                  }}
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-baseline leading-none">
                  <span className={`${isAdminPreview ? 'text-[12.5px]' : 'text-[15px] sm:text-[18px] md:text-[20px]'} font-black tracking-tight text-[#b20606] drop-shadow-2xs leading-none whitespace-nowrap`}>
                    Jhadimadi<span className="text-[#065f46]">.com</span>
                  </span>
                </div>
                <span className={`${isAdminPreview ? 'text-[7px]' : 'text-[9px] sm:text-[10.5px]'} font-bold text-[#065f46] tracking-tight leading-tight block mt-0.5 whitespace-nowrap`}>
                  ঝাদিমাদি ডটকম
                </span>
              </div>
            </div>
          </div>

          {/* Middle: Desktop / Web View Professional Navigation Menu (Visible on Home Tab on Tablet Landscape & Desktop >= 768px, but hidden in Mobile Preview) */}
          {!isAdminPreview && activeTab === 'home' && onNavigateTab && (
            <nav 
              className="hidden md:flex items-center gap-1 lg:gap-1.5 px-2 py-0.5 mx-auto bg-transparent"
              aria-label="Desktop Navigation"
            >
              <button
                type="button"
                onClick={() => onNavigateTab('home')}
                className="h-7 px-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer bg-white sm:bg-transparent border border-[#065f46] text-[#065f46] shadow-xs"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{isEn ? 'Home' : 'হোম'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('search')}
                className="h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-transparent text-stone-700 hover:text-[#065f46] border border-transparent active:scale-95"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isEn ? 'Search' : 'খোঁজ'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('categories')}
                className="h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-transparent text-stone-700 hover:text-[#065f46] border border-transparent active:scale-95"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{isEn ? 'Services & Categories' : 'সেবা ও ক্যাটাগরি'}</span>
              </button>

              {onOpenAiChat && (
                <button
                  type="button"
                  onClick={onOpenAiChat}
                  className="h-7 px-2.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer bg-white sm:bg-transparent hover:bg-emerald-50/50 text-[#065f46] border border-[#065f46] shadow-2xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#065f46]" />
                  <span>{isEn ? 'Jhadimadi AI' : 'ঝাদিমাদি AI'}</span>
                </button>
              )}

              {onPostClick && (
                <button
                  type="button"
                  onClick={onPostClick}
                  className="h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-transparent text-stone-700 hover:text-[#065f46] border border-transparent active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Post / Register' : 'বিজ্ঞাপন / সেবা দিন'}</span>
                </button>
              )}
            </nav>
          )}

          {/* Right Side: Controls - Proportional inline buttons without clipping */}
          <div className={`flex flex-row items-center justify-end ${isAdminPreview ? 'gap-1' : 'gap-1 sm:gap-1.5'} shrink-0 flex-nowrap`}>
            {/* Extra buttons (Sign In / User Profile, Cart) visible ONLY on Home page */}
            {activeTab === 'home' && (
              <>
                {/* Sign In / User Profile */}
                {currentUser ? (
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    id="btn-header-my-account"
                    className={`${isAdminPreview ? 'h-6.5 px-1.5 text-[8.5px]' : 'h-7 sm:h-7.5 px-1.5 sm:px-2 text-[9px] sm:text-[10px]'} flex flex-row items-center gap-1 bg-white sm:bg-transparent hover:bg-emerald-50/60 text-[#065f46] rounded-lg font-black transition-all cursor-pointer border border-[#065f46] active:scale-95 shadow-2xs shrink-0`}
                    title={isEn ? 'My Profile' : 'আমার প্রোফাইল'}
                  >
                    <img 
                      src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"} 
                      alt="user avatar" 
                      className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-[#065f46] shrink-0" 
                    />
                    <span className={`max-w-[42px] sm:max-w-[60px] truncate whitespace-nowrap ${isAdminPreview ? 'hidden' : 'hidden min-[340px]:inline'} text-[#065f46] font-bold`}>
                      {currentUser.name ? currentUser.name.split(' ')[0] : (isEn ? 'Profile' : 'প্রোফাইল')}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenAuth && onOpenAuth('signin')}
                    id="btn-header-signin"
                    className={`${isAdminPreview ? 'h-6.5 px-1.5 text-[8.5px]' : 'h-7 sm:h-7.5 px-1.5 sm:px-2 text-[9px] sm:text-[10px]'} bg-white sm:bg-transparent hover:bg-emerald-50/60 active:scale-95 text-[#065f46] hover:text-[#065f46] rounded-lg font-black shadow-2xs flex flex-row items-center gap-1 border border-[#065f46] cursor-pointer transition shrink-0`}
                    title={isEn ? 'Sign In' : 'সাইন ইন করুন'}
                  >
                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#065f46] shrink-0" />
                    <span className="whitespace-nowrap font-black text-[#065f46]">{isEn ? 'Sign In' : 'লগইন'}</span>
                  </button>
                )}

                {/* Shopping Cart Button */}
                {onOpenCart && (
                  <button 
                    type="button"
                    onClick={onOpenCart}
                    className={`${isAdminPreview ? 'h-6.5 w-6.5' : 'h-7 w-7 sm:h-7.5 sm:w-7.5'} rounded-lg bg-white sm:bg-transparent hover:bg-emerald-50/60 active:scale-90 text-[#065f46] relative transition flex items-center justify-center shadow-2xs border border-[#065f46] cursor-pointer shrink-0`}
                    title={isEn ? 'Market Cart' : 'মার্কেট কার্ট'}
                    aria-label={isEn ? 'Market Cart' : 'মার্কেট কার্ট'}
                    id="btn-header-cart"
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#065f46]" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#065f46] text-white text-[7.5px] font-black min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center shadow-xs border border-white leading-none">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </button>
                )}
              </>
            )}

            {/* Language Switcher Button (EN / BN) - ALWAYS at the far RIGHT corner across all pages! */}
            {setLang && (
              <button
                type="button"
                onClick={handleLangToggle}
                className={`${isAdminPreview ? 'h-6.5 px-1.5 text-[8.5px]' : 'h-7 sm:h-7.5 px-1.5 sm:px-2 text-[9px] sm:text-[10px]'} rounded-lg bg-white sm:bg-transparent hover:bg-emerald-50/60 active:scale-95 text-[#065f46] transition flex flex-row items-center gap-1 border border-[#065f46] shadow-2xs cursor-pointer shrink-0`}
                title={isEn ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
                aria-label={isEn ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
                id="btn-header-lang-toggle"
              >
                <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#065f46] shrink-0" />
                <span className="font-black tracking-tight whitespace-nowrap text-[#065f46]">
                  {isEn ? 'বাংলা' : 'EN'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
