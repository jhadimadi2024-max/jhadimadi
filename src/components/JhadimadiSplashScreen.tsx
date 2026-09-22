import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface JhadimadiSplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

/**
 * Centered Modern Splash Screen for Jhadimadi.com
 *
 * Requirements:
 * 1. Position the Jhadimadi logo strictly at the EXACT CENTER of the mobile screen.
 * 2. Clean, centered vertical layout:
 *    - Main logo / brand name at the top
 *    - Slogan "কোনো কাজই ছোট নয়, সব পেশায় সম্মান" placed directly underneath it in a clean, centered format.
 * 3. Fluid, instantaneous transition to the home page with zero infinite freeze.
 */

// Fallback image chain for the red runner logo ONLY
const RUNNER_LOGO_CANDIDATES = [
  '/runner-logo-hires.png',
  '/runner-logo.png',
  '/assets/images/runner-logo-hires.png',
  '/assets/images/runner-logo.png',
];

// Pre-decode logo image in module scope so bitmap is already cached before first frame
if (typeof window !== 'undefined') {
  RUNNER_LOGO_CANDIDATES.slice(0, 2).forEach((src) => {
    try {
      const img = new Image();
      img.src = src;
      if ('decode' in img) {
        img.decode().catch(() => {});
      }
    } catch (_) {}
  });
}

export const JhadimadiSplashScreen: React.FC<JhadimadiSplashScreenProps> = ({
  onFinish,
  durationMs = 950,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoIdx, setLogoIdx] = useState(0);

  useEffect(() => {
    // Graceful exit timeline
    const exitTime = Math.max(500, durationMs - 200);
    const tExit = setTimeout(() => {
      setIsVisible(false);
      const finishTimer = setTimeout(() => {
        onFinish();
      }, 200);
      return () => clearTimeout(finishTimer);
    }, exitTime);

    return () => {
      clearTimeout(tExit);
    };
  }, [durationMs, onFinish]);

  const currentLogo = RUNNER_LOGO_CANDIDATES[logoIdx] || '/runner-logo-hires.png';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="jhadimadi-splash-screen"
          key="jhadimadi-splash-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 w-full h-full min-h-screen min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-4 m-0 overflow-hidden select-none z-[999999]"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            minWidth: '100vw',
            height: '100%',
            minHeight: '100dvh',
            backgroundColor: '#000000',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
          }}
          aria-label="Jhadimadi.com Intro"
          role="dialog"
          aria-modal="true"
        >
          {/* Main Content strictly positioned at the EXACT CENTER of the mobile screen */}
          <div className="relative w-full max-w-sm flex flex-col items-center justify-center text-center px-4">
            
            {/* 1. Red Runner Logo Graphic - Centered at Top */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center justify-center mb-3 sm:mb-4"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                <img
                  src={currentLogo}
                  alt="Jhadimadi Logo"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  fetchPriority="high"
                  className="w-full h-full object-contain select-none pointer-events-none drop-shadow-md"
                  onError={() => {
                    setLogoIdx((prev) => (prev + 1 < RUNNER_LOGO_CANDIDATES.length ? prev + 1 : prev));
                  }}
                />
              </div>
            </motion.div>

            {/* 2. Main Brand Name (Jhadimadi.com) */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-baseline justify-center text-center leading-none"
            >
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none text-center">
                Jhadimadi<span className="text-[#e50914] font-black">.com</span>
              </h1>
            </motion.div>

            {/* 3. Centered Bengali Slogan Directly Underneath */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.18,
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-2.5 sm:mt-3 text-center"
            >
              <p className="text-[15px] sm:text-[17px] font-bold text-slate-100 tracking-normal leading-relaxed text-center">
                কোনো কাজই ছোট নয়, সব পেশায় সম্মান
              </p>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
