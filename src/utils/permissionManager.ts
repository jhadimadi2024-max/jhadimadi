/**
 * Jhadimadi.com - Lazy On-Demand Permission Manager
 * 
 * Strict Compliance with Google Play Store Permissions Policy & Web Best Practices:
 * 1. ZERO permissions requested at app startup, on window load, or in the background.
 * 2. Camera and Microphone permissions are ONLY requested when the user explicitly triggers
 *    a corresponding feature (e.g. clicking the microphone button or the camera image search).
 * 3. Graceful handling when permissions are denied, with helpful localized explanations.
 */

export type MediaPermissionType = 'camera' | 'microphone';

export interface PermissionResult {
  granted: boolean;
  status: 'granted' | 'denied' | 'prompt' | 'unsupported';
  error?: string;
  errorMessageBn?: string;
}

/**
 * Checks current permission status without prompting the user.
 * Safe to call; does not trigger any browser or device permission dialog.
 */
export async function checkPermissionStatusSafe(type: MediaPermissionType): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  if (typeof window === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
    return 'prompt';
  }

  try {
    const permissionName = type === 'camera' ? 'camera' : 'microphone';
    const status = await navigator.permissions.query({ name: permissionName as any });
    return status.state;
  } catch {
    // Some browsers do not support querying 'camera' or 'microphone' via permissions.query
    return 'prompt';
  }
}

/**
 * Requests microphone permission strictly upon an active user gesture (e.g. clicking the voice search mic).
 * NEVER call this on app startup or in background timers.
 */
export async function requestMicrophoneOnDemand(): Promise<PermissionResult> {
  if (typeof window === 'undefined') {
    return { granted: false, status: 'unsupported' };
  }

  // Check if Web Speech API or MediaDevices is supported
  const hasWebSpeech = Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const hasMediaDevices = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  if (!hasWebSpeech && !hasMediaDevices) {
    return {
      granted: false,
      status: 'unsupported',
      error: 'Microphone speech recognition is not supported on this device/browser.',
      errorMessageBn: 'আপনার ব্রাউজার বা ডিভাইসে মাইক্রোফোন বা স্পিচ রিকগনিশন সমর্থন করে না।'
    };
  }

  // Check current status safely first
  const currentStatus = await checkPermissionStatusSafe('microphone');
  if (currentStatus === 'denied') {
    return {
      granted: false,
      status: 'denied',
      error: 'Microphone permission was previously denied. Please enable it in browser/app settings.',
      errorMessageBn: 'মাইক্রোফোনের অনুমতি বন্ধ রয়েছে। অনুগ্রহ করে ব্রাউজার বা অ্যাপ সেটিংসে গিয়ে পারমিশন চালু করুন।'
    };
  }

  // If already granted, proceed immediately
  if (currentStatus === 'granted') {
    return { granted: true, status: 'granted' };
  }

  // On mobile phones, installed PWAs, and mobile WebViews, calling SpeechRecognition.start()
  // directly without pre-granted OS audio permission often silently fails or throws 'not-allowed'.
  // Triggering navigator.mediaDevices.getUserMedia({ audio: true }) opens the native Android/iOS
  // system permission dialog ("Allow Jhadimadi to record audio?").
  if (hasMediaDevices) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Crucial: immediately release the audio hardware track so SpeechRecognition or MediaRecorder
      // can bind cleanly without device contention.
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true, status: 'granted' };
    } catch (err: any) {
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      return {
        granted: false,
        status: isDenied ? 'denied' : 'unsupported',
        error: err.message || 'Failed to acquire microphone permission',
        errorMessageBn: isDenied 
          ? 'মাইক্রোফোন ব্যবহারের অনুমতি পাওয়া যায়নি। কথা বলার জন্য মাইক্রোফোন পারমিশন দিন।'
          : 'মাইক্রোফোন সংযোগ স্থাপন করা সম্ভব হয়নি।'
      };
    }
  }

  // Fallback for browsers with Web Speech but without getUserMedia
  if (hasWebSpeech) {
    return { granted: true, status: 'prompt' };
  }

  return {
    granted: false,
    status: 'unsupported',
    errorMessageBn: 'আপনার ব্রাউজার বা ডিভাইসে মাইক্রোফোন সমর্থন করে না।'
  };
}

/**
 * Requests camera permission strictly upon an active user gesture (e.g. clicking the camera search icon).
 * NEVER call this on app startup or in background timers.
 */
export async function requestCameraOnDemand(): Promise<PermissionResult> {
  if (typeof window === 'undefined') {
    return { granted: false, status: 'unsupported' };
  }

  // Check current status safely first
  const currentStatus = await checkPermissionStatusSafe('camera');
  if (currentStatus === 'denied') {
    return {
      granted: false,
      status: 'denied',
      error: 'Camera permission was previously denied. Please enable it in browser/app settings.',
      errorMessageBn: 'ক্যামেরা ব্যবহারের অনুমতি বন্ধ রয়েছে। অনুগ্রহ করে ব্রাউজার বা ডিভাইস সেটিংসে গিয়ে পারমিশন চালু করুন।'
    };
  }

  // If using standard HTML file input with capture="environment", the browser/OS manages the prompt natively.
  // We return granted: true to allow the file input click to proceed.
  return { granted: true, status: currentStatus };
}
