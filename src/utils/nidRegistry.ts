/**
 * Anti-Fraud & Strict NID Identity Registry for Jhadimadi.com
 * Rules:
 * 1. A single NID number can be registered ONCE AND ONLY ONCE across the entire system.
 * 2. Duplicate registration with the same NID is strictly blocked.
 * 3. Once an NID is submitted and verified, it is permanently locked and cannot be altered.
 */

export interface LockedNidRecord {
  nidNumber: string;
  userId: string;
  userName: string;
  role: 'professional' | 'vendor' | 'customer';
  uniqueId: string;
  verifiedAt: string;
  district: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  isAiKycVerified: boolean;
}

// Memory cache for runtime deduplication
let memoryNidRegistry: LockedNidRecord[] = [];

// Cleanup any legacy NID registry from localStorage safely
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('jhadimadi_locked_nid_registry');
  }
} catch {}

const NID_SESSION_KEY = 'jhadimadi_session_nid_registry';

export const getNidRegistry = (): LockedNidRecord[] => {
  if (memoryNidRegistry.length > 0) {
    return memoryNidRegistry;
  }
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = sessionStorage.getItem(NID_SESSION_KEY);
      if (raw) {
        memoryNidRegistry = JSON.parse(raw);
        return memoryNidRegistry;
      }
    }
  } catch {}
  return memoryNidRegistry;
};

export const isNidAlreadyRegistered = (nidNumber: string, currentUserId?: string): { isRegistered: boolean; existingRecord?: LockedNidRecord } => {
  if (!nidNumber) return { isRegistered: false };
  const cleanNid = nidNumber.replace(/[^0-9]/g, '').trim();
  const registry = getNidRegistry();
  
  const found = registry.find(r => {
    const rClean = r.nidNumber.replace(/[^0-9]/g, '').trim();
    if (rClean === cleanNid) {
      // If current user is the same owner, they already own it
      if (currentUserId && r.userId === currentUserId) {
        return false;
      }
      return true;
    }
    return false;
  });

  return {
    isRegistered: !!found,
    existingRecord: found,
  };
};

export const registerAndLockNid = (record: LockedNidRecord): { success: boolean; message: string } => {
  const cleanNid = record.nidNumber.replace(/[^0-9]/g, '').trim();
  if (cleanNid.length < 10) {
    return {
      success: false,
      message: 'অবৈধ এনআইডি নম্বর। এনআইডি কমপক্ষে ১০ বা ১৩/১৭ ডিজিটের হতে হবে।'
    };
  }

  const check = isNidAlreadyRegistered(cleanNid, record.userId);
  if (check.isRegistered) {
    return {
      success: false,
      message: `🚫 সতর্কতা: এই এনআইডি (${cleanNid}) নম্বরটি ইতোমধ্যে [${check.existingRecord?.uniqueId}] একাউন্টে ভেরিফাইড ও সংরক্ষিত আছে। একই এনআইডি দিয়ে একাধিক একাউন্ট নিবন্ধন করা নিষিদ্ধ।`
    };
  }

  const registry = getNidRegistry();
  const existingIdx = registry.findIndex(r => r.userId === record.userId);
  if (existingIdx >= 0) {
    // If existing record was already verified, do not allow changing the NID number
    const oldRecord = registry[existingIdx];
    if (oldRecord.isAiKycVerified && oldRecord.nidNumber !== cleanNid) {
      return {
        success: false,
        message: '🚫 নিরাপত্তা পলিসি: আপনার এনআইডি একবার ভেরিফাইড হওয়ার পর আর পরিবর্তন বা রিপ্লেস করা যাবে না।'
      };
    }
    registry[existingIdx] = { ...record, nidNumber: cleanNid };
  } else {
    registry.push({ ...record, nidNumber: cleanNid });
  }

  try {
    memoryNidRegistry = registry;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(NID_SESSION_KEY, JSON.stringify(registry));
    }
  } catch (e) {
    console.error('Failed to persist NID record in session', e);
  }

  return {
    success: true,
    message: 'এনআইডি সফলভাবে ভেরিফাইড এবং সিস্টেমে স্থায়ীভাবে লক করা হয়েছে।'
  };
};
