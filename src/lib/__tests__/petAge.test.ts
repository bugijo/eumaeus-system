import { describe, expect, it } from 'vitest';
import { petAgeLabel } from '../utils';

describe('petAgeLabel', () => {
  const now = new Date(2026, 10, 23);
  it('conta anos e meses pela data de nascimento', () => {
    expect(petAgeLabel('2019-03-11', null, now)).toBe('7 anos');
    expect(petAgeLabel('2026-03-01', null, now)).toBe('8 meses');
    expect(petAgeLabel('2025-11-01', null, now)).toBe('1 ano');
  });
  it('usa a idade informada ou avisa que falta', () => {
    expect(petAgeLabel(null, 4, now)).toBe('4 anos');
    expect(petAgeLabel(null, undefined, now)).toBe('Não informada');
  });
});
