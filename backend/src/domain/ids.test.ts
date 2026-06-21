import { describe, expect, test } from 'vitest';
import { newId } from './ids.js';

describe('newId', () => {
  test('prefixes the generated id with the given prefix and an underscore', () => {
    const id = newId('usr');
    expect(id.startsWith('usr_')).toBe(true);
  });

  test('produces a non-empty suffix after the prefix', () => {
    const id = newId('cmp');
    expect(id.length).toBeGreaterThan('cmp_'.length);
  });

  test('two calls produce different ids', () => {
    expect(newId('usr')).not.toBe(newId('usr'));
  });
});
