import { describe, expect, it } from 'vitest';
import { FakeClock } from './clock.js';

describe('FakeClock', () => {
  it('now() returns the fixed time it was constructed with', () => {
    const clock = new FakeClock('2024-01-01T00:00:00.000Z');
    expect(clock.now()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('now() stays fixed across multiple calls until advanced', () => {
    const clock = new FakeClock('2024-01-01T00:00:00.000Z');
    expect(clock.now()).toBe('2024-01-01T00:00:00.000Z');
    expect(clock.now()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('advance(ms) moves the clock forward by the given milliseconds', () => {
    const clock = new FakeClock('2024-01-01T00:00:00.000Z');
    clock.advance(1000);
    expect(clock.now()).toBe('2024-01-01T00:00:01.000Z');
  });

  it('set(iso) jumps the clock to an explicit timestamp', () => {
    const clock = new FakeClock('2024-01-01T00:00:00.000Z');
    clock.set('2030-05-05T12:00:00.000Z');
    expect(clock.now()).toBe('2030-05-05T12:00:00.000Z');
  });

  it('defaults to a fixed epoch when constructed with no argument', () => {
    const clock = new FakeClock();
    expect(typeof clock.now()).toBe('string');
    expect(clock.now()).toBe(clock.now());
  });
});
