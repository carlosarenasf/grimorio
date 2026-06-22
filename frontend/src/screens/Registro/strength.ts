/**
 * Password strength helper (DESIGN_SPEC.md Registro screen: 4-bar meter).
 *
 * Scores 0..4 by counting how many of these classes are satisfied:
 *  - length >= 8
 *  - mixed case (has a lowercase AND an uppercase letter)
 *  - has a digit
 *  - has a symbol (non alphanumeric)
 *
 * A password shorter than 8 characters can still score on the other rules,
 * but in practice "valid" (per the screen's submit rule) requires length>=8.
 */

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

const HAS_LOWER = /[a-z]/;
const HAS_UPPER = /[A-Z]/;
const HAS_DIGIT = /\d/;
const HAS_SYMBOL = /[^A-Za-z0-9]/;

export function passwordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (HAS_LOWER.test(password) && HAS_UPPER.test(password)) score += 1;
  if (HAS_DIGIT.test(password)) score += 1;
  if (HAS_SYMBOL.test(password)) score += 1;

  return score as PasswordStrength;
}

export const STRENGTH_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'] as const;

export function passwordStrengthLabel(score: PasswordStrength): string {
  return STRENGTH_LABELS[score];
}
