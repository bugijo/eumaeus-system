import { describe, expect, it } from 'vitest';
import { canWriteClinical } from '../access';

describe('canWriteClinical', () => {
  it('libera só DONO e VETERINARIO, igual à API', () => {
    expect(canWriteClinical('DONO')).toBe(true);
    expect(canWriteClinical('veterinario')).toBe(true);
    for (const role of ['AUXILIAR', 'RECEPCAO', 'BANHO_TOSA', 'FINANCEIRO', undefined, null, '']) {
      expect(canWriteClinical(role as any)).toBe(false);
    }
  });
});
