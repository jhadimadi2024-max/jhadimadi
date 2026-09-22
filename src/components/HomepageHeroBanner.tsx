import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

interface HomepageHeroBannerProps {
  onBannerClick?: (targetLink?: string) => void;
  lang?: 'bn' | 'en';
}

/**
 * Dynamic Database-driven Homepage Hero Banner.
 * Exclusively renders banners dynamically fetched from the database / Supabase table.
 * If there are no active banners in the database, this component returns null (completely hidden/blank).
 */
export const HomepageHeroBanner: React.FC<HomepageHeroBannerProps> = ({ onBannerClick, lang = 'bn' }) => {
  const { banners } = useData();

  // Exclusively dynamic active banners from database (filtering out corrupt/missing image rows)
  const activeBanners = useMemo(() => {
    return (banners || [])
      .filter(b => {
        if (!b || !b.id || b.isActive === false) return false;
        const img = b.imageUrl || b.image_url || (b as any).image || '';
        if (!img || typeof img !== 'string' || !img.trim()) return false;
        return !b.placement || b.placement === 'homepage_hero';
      })
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  }, [banners]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Keep index within bounds if active banners change
  useEffect(() => {
    if (currentIndex >= activeBanners.length && activeBanners.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  // Auto-rotation timer (pauses on hover or touch)
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused]);

  // If no banners in database, remain completely hidden/blank
  if (activeBanners.length === 0) {
    return null;
  }

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left -> next
        setCurrentIndex(prev => (prev + 1) % activeBanners.length);
      } else {
        // Swiped right -> prev
        setCurrentIndex(prev => (prev === 0 ? activeBanners.length - 1 : prev - 1));
      }
    }
    touchStartXRef.current = null;
  };

  return (
    <div 
      className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-xs border border-stone-200/80 bg-stone-900 select-none group"
      id="homepage-dynamic-hero-banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Aspect Ratio Container (e.g. 21:9 for modern sleek mobile & desktop presentation) */}
      <div 
        className="relative w-full aspect-[21/9] sm:aspect-[24/9] md:aspect-[28/9] min-h-[120px] max-h-[220px] cursor-pointer"
        onClick={() => onBannerClick?.(currentBanner.targetLink)}
        role="button"
        tabIndex={0}
        aria-label={currentBanner.title || 'Promotional Banner'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onBannerClick?.(currentBanner.targetLink);
          }
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id || currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Banner Image */}
            <img
              src={getProductPublicUrl(currentBanner.imageUrl || currentBanner.image_url || (currentBanner as any).image)}
              alt={currentBanner.title || 'Promo Banner'}
              referrerPolicy="no-referrer"
              loading="lazy"
              data-banner-image="true"
              className="w-full h-full object-cover bg-stone-900"
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                // If the image fails to load, gracefully fallback to clean styled banner background
                const target = e.currentTarget;
                target.onerror = null;
                target.src = NO_IMAGE_AVAILABLE_ICON;
                target.style.display = 'none';
              }}
            />

            {/* Gradient Overlay for Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-3 sm:p-4 text-white">
              {currentBanner.tag && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-white rounded-full text-[9px] sm:text-[10px] font-bold shadow-xs">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    {currentBanner.tag}
                  </span>
                </div>
              )}

              {currentBanner.title && (
                <h3 className="text-xs sm:text-base md:text-lg font-black leading-tight drop-shadow-xs line-clamp-1">
                  {currentBanner.title}
                </h3>
              )}

              {currentBanner.subtitle && (
                <p className="text-[10px] sm:text-xs text-stone-200/90 line-clamp-1 mt-0.5 drop-shadow-xs">
                  {currentBanner.subtitle}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Controls (Shown only if > 1 banner) */}
        {activeBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              id="btn-hero-banner-prev"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer active:scale-90"
              aria-label="Previous Banner"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              id="btn-hero-banner-next"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer active:scale-90"
              aria-label="Next Banner"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Pagination Indicators */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {activeBanners.map((b, idx) => (
                <button
                  key={b.id || idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  id={`btn-hero-banner-dot-${idx}`}
                  className={`h-1 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'w-4 bg-emerald-400'
                      : 'w-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to banner ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomepageHeroBanner;

