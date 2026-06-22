import { describe, expect, it } from 'vitest';
import { passwordStrength, passwordStrengthLabel } from './strength';

describe('passwordStrength', () => {
  it('scores an empty password as 0', () => {
    expect(passwordStrength('')).toBe(0);
  });

  it('scores a short, simple password low', () => {
    expect(passwordStrength('abc')).toBe(0);
  });

  it('scores length-only as 1', () => {
    expect(passwordStrength('abcdefgh')).toBe(1);
  });

  it('increases score with mixed case', () => {
    expect(passwordStrength('abcdefGh')).toBe(2);
  });

  it('increases score with a digit added', () => {
    expect(passwordStrength('abcdefG1')).toBe(3);
  });

  it('scores a long mixed-case+digit+symbol password as 4 (max)', () => {
    expect(passwordStrength('abcdefG1!')).toBe(4);
  });

  it('strictly increases as the password gets stronger', () => {
    const scores = ['abc', 'abcdefgh', 'abcdefGh', 'abcdefG1', 'abcdefG1!'].map(
      passwordStrength,
    );
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
    expect(scores[scores.length - 1]).toBeGreaterThan(scores[0]);
  });

  it('maps each score to a Spanish label', () => {
    expect(passwordStrengthLabel(0)).toBe('Muy débil');
    expect(passwordStrengthLabel(4)).toBe('Muy fuerte');
  });
});
