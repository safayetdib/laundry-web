import { describe, it, expect } from 'vitest';
import { formatBdt, takaToMinor } from './money';

describe('money', () => {
  it('formats poisha as taka', () => {
    expect(formatBdt(10050)).toBe('৳100.50');
    expect(formatBdt(5)).toBe('৳0.05');
    expect(formatBdt(100000)).toBe('৳1,000.00');
  });

  it('converts taka to minor units', () => {
    expect(takaToMinor(100.5)).toBe(10050);
  });
});
