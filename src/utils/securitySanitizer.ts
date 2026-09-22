/**
 * Jhadimadi.com - Security Sanitizer & Input Validation Engine
 * 
 * Compliant with Google Play Store Security Guidelines, OWASP Top 10,
 * and Cross-Site Scripting (XSS) Prevention Standards.
 * 
 * Protects against:
 * 1. Stored & Reflected XSS (<script>, event handlers, javascript: URIs)
 * 2. HTML Injection & Tag Smuggling
 * 3. Control Character & Null Byte Injection
 * 4. SQL/NoSQL Injection token abuse in search inputs
 * 5. Buffer & Payload Overflow attacks
 */

// Regular expressions for dangerous HTML tags and event handlers
const DANGEROUS_TAGS_REGEX = /<\/?(script|iframe|object|embed|style|meta|link|base|form|input|button|textarea|svg|math|applet)[^>]*>/gi;
const EVENT_HANDLER_REGEX = /\bon\w+\s*=\s*(['"]).*?\1|\bon\w+\s*=\s*[^>\s]+/gi;
const SCRIPT_PSEUDO_PROTOCOL_REGEX = /(javascript|vbscript|data):/gi;
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const SQL_INJECTION_TOKENS_REGEX = /(--|\/\*|\*\/|@@|char\s*\(|nchar\s*\(|varchar\s*\(|alter\s+table|drop\s+table|union\s+select|insert\s+into)/gi;

/**
 * Sanitizes generic user text input (Form fields, comments, descriptions).
 * Strips script tags, HTML tags, event handlers, and control characters,
 * while safely preserving Bengali Unicode characters, English text, and punctuation.
 */
export function sanitizeText(input: unknown, maxLength = 1000): string {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // Remove null bytes and control characters
  str = str.replace(CONTROL_CHARS_REGEX, '');

  // Strip dangerous pseudo-protocols
  str = str.replace(SCRIPT_PSEUDO_PROTOCOL_REGEX, '');

  // Strip event handlers (e.g. onerror=, onclick=)
  str = str.replace(EVENT_HANDLER_REGEX, '');

  // Strip dangerous HTML tags
  str = str.replace(DANGEROUS_TAGS_REGEX, '');

  // Replace remaining raw angle brackets to prevent tag synthesis
  str = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Trim and enforce length limit
  return str.trim().slice(0, maxLength);
}

/**
 * Sanitizes search queries (Search matrix, home search bar, category search).
 * Prevents script injection, SQL keywords, and query bloat.
 * Removes invisible zero-width characters (ZWJ, ZWNJ, BOM) which break string searches.
 */
export function sanitizeSearchQuery(query: unknown, maxLength = 150, preserveTrailingSpace = false): string {
  if (!query) return '';
  let str = String(query);

  // Remove zero-width characters (ZWJ, ZWNJ, BOM)
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Remove control characters
  str = str.replace(CONTROL_CHARS_REGEX, '');

  // Remove script/HTML tags
  str = str.replace(DANGEROUS_TAGS_REGEX, '');
  str = str.replace(EVENT_HANDLER_REGEX, '');
  str = str.replace(SCRIPT_PSEUDO_PROTOCOL_REGEX, '');

  // Filter aggressive SQL injection tokens
  str = str.replace(SQL_INJECTION_TOKENS_REGEX, '');

  // Normalize excessive whitespaces
  str = str.replace(/[ \t]+/g, ' ');

  // Remove angle brackets and quote characters that can break query contexts
  str = str.replace(/[<>"'`]/g, '');

  if (preserveTrailingSpace) {
    return str.replace(/^\s+/, '').slice(0, maxLength);
  }
  return str.trim().slice(0, maxLength);
}

/**
 * Sanitizes and validates Bangladesh phone numbers.
 * Supports standard local format (e.g. 01812345678, +8801812345678, 8801812345678).
 */
export function sanitizePhone(phone: unknown): string {
  if (!phone) return '';
  let clean = String(phone).replace(/[^\d+]/g, '');

  // Normalize +880 or 880 prefix
  if (clean.startsWith('+880')) {
    clean = '0' + clean.slice(4);
  } else if (clean.startsWith('880')) {
    clean = '0' + clean.slice(3);
  }

  // Enforce max 14 chars
  return clean.slice(0, 14);
}

/**
 * Validates whether a phone number is a valid Bangladesh mobile number.
 */
export function isValidBangladeshPhone(phone: string): boolean {
  const sanitized = sanitizePhone(phone);
  // Valid Bangladeshi prefixes: 013, 014, 015, 016, 017, 018, 019 followed by 8 digits
  return /^01[3-9]\d{8}$/.test(sanitized);
}

/**
 * Sanitizes email addresses.
 */
export function sanitizeEmail(email: unknown): string {
  if (!email) return '';
  let str = String(email).trim().toLowerCase();
  str = str.replace(CONTROL_CHARS_REGEX, '');
  str = str.replace(/[<>"'`\s]/g, '');
  return str.slice(0, 100);
}

/**
 * Validates whether an email has a valid structure.
 */
export function isValidEmail(email: string): boolean {
  const sanitized = sanitizeEmail(email);
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(sanitized);
}

/**
 * Sanitizes customer or user full names.
 * Preserves Bengali characters, English letters, spaces, hyphens, and periods.
 */
export function sanitizeName(name: unknown, maxLength = 80): string {
  if (!name) return '';
  let str = String(name);
  str = str.replace(CONTROL_CHARS_REGEX, '');
  str = str.replace(DANGEROUS_TAGS_REGEX, '');
  str = str.replace(EVENT_HANDLER_REGEX, '');
  str = str.replace(/[<>"'`]/g, '');
  str = str.replace(/\s+/g, ' ');
  return str.trim().slice(0, maxLength);
}

/**
 * Sanitizes street, union, or delivery addresses.
 * Preserves Bengali text, English letters, numbers, commas, hyphens, and slashes.
 */
export function sanitizeAddress(address: unknown, maxLength = 300): string {
  if (!address) return '';
  let str = String(address);
  str = str.replace(CONTROL_CHARS_REGEX, '');
  str = str.replace(DANGEROUS_TAGS_REGEX, '');
  str = str.replace(EVENT_HANDLER_REGEX, '');
  str = str.replace(/[<>"'`]/g, '');
  str = str.replace(/\s+/g, ' ');
  return str.trim().slice(0, maxLength);
}

/**
 * Recursively sanitizes any JavaScript object or array before saving to database
 * or transmitting over network API.
 */
export function sanitizeObject<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    // If it's a data URL image, leave it untouched
    if (input.startsWith('data:image/') || input.startsWith('https://') || input.startsWith('http://')) {
      return input;
    }
    return sanitizeText(input) as unknown as T;
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }

  if (input instanceof Date) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      // Don't modify keys, only sanitize string values
      sanitizedObj[key] = sanitizeObject(value);
    }
    return sanitizedObj as T;
  }

  return input;
}
