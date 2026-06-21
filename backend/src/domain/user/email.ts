/**
 * Email normalization and validation — pure helpers, no I/O.
 */

/** Trims surrounding whitespace and lowercases for canonical storage/lookup. */
export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

// Simple, conservative shape check: local@domain.tld, no internal whitespace.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** True if `s` looks like a valid email address (basic shape check, not RFC-exhaustive). */
export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s);
}
