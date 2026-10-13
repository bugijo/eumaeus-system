import { describe, expect, it } from 'vitest';
import { decimalToNumber, formatBRL, normalizeDecimalInput } from '../decimal';

describe('decimal presentation helpers', () => {
  it('accepts Brazilian input without turning the request into a binary float', () => {
    expect(normalizeDecimalInput('5,01')).toBe('5.01');
    expect(normalizeDecimalInput('0')).toBeNull();
    expect(normalizeDecimalInput('5,001')).toBeNull();
  });

  it('converts serialized Decimal only for display', () => {
    expect(decimalToNumber('12.34')).toBe(12.34);
    expect(formatBRL('12.34')).toContain('12,34');
  });
});
