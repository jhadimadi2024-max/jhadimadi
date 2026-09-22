/**
 * Privacy & Security Utilities for Jhadimadi Platform
 * Enforces strict data privacy for public user listings and profile cards:
 * - Hides sensitive personal data (Mobile Numbers, NID cards, Full Permanent Addresses)
 * - Restricts full personal information strictly to authorized admins
 * - Generates secure tel: URIs for background Click-to-Call actions without DOM leakage
 */

export function cleanPhoneNumber(rawPhone?: string): string {
  if (!rawPhone) return '';
  // Keep only digits and leading '+'
  const cleaned = rawPhone.replace(/[^\d+]/g, '');
  return cleaned;
}

export function formatTelUri(rawPhone?: string): string {
  const cleaned = cleanPhoneNumber(rawPhone);
  if (!cleaned) return 'tel:';
  return `tel:${cleaned}`;
}

export function triggerClickToCall(rawPhone?: string, onFail?: () => void): void {
  const uri = formatTelUri(rawPhone);
  const cleaned = cleanPhoneNumber(rawPhone);
  if (!cleaned || cleaned.length < 5) {
    if (onFail) onFail();
    return;
  }
  try {
    window.location.href = uri;
  } catch {
    // Fallback for strict browser policies
    const tempLink = document.createElement('a');
    tempLink.href = uri;
    tempLink.style.display = 'none';
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
  }
}

export function maskPhoneNumber(phone?: string, maskChar: string = '•'): string {
  if (!phone) return '🔒 ব্যক্তিগত নম্বর সুরক্ষিত';
  const clean = cleanPhoneNumber(phone);
  if (clean.length >= 10) {
    const start = clean.slice(0, 3);
    const end = clean.slice(-2);
    return `${start}${maskChar.repeat(5)}${end}`;
  }
  return '🔒 নম্বর সুরক্ষিত';
}

export function maskNid(nid?: string): string {
  if (!nid) return '🔒 অ্যাডমিন সংরক্ষিত';
  const clean = nid.trim();
  if (clean.length >= 10) {
    return `${clean.slice(0, 3)}••••••${clean.slice(-2)}`;
  }
  return '🔒 এনআইডি সুরক্ষিত';
}

export function sanitizePublicAddress(
  fullAddress?: string,
  upazila?: string,
  district?: string
): string {
  if (upazila && district) {
    return `${upazila}, ${district}`;
  }
  if (district) {
    return district;
  }
  if (upazila) {
    return upazila;
  }
  return 'পার্বত্য চট্টগ্রাম (বিস্তারিত অ্যাডমিন সংরক্ষিত)';
}
