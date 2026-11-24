import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CatalogSearch from '../CatalogSearch';
import { MEDICATION_CATALOG, searchCatalog } from '@/data/medicationCatalog';

describe('catálogo de medicamentos', () => {
  it('busca sem acento e por partes do nome', () => {
    expect(searchCatalog('omega').map((i) => i.name)).toContain('Ômega 3 cápsula');
    expect(searchCatalog('melox 2 mg').map((i) => i.name)).toEqual(['Meloxicam 2 mg comprimido']);
    expect(searchCatalog('a')).toEqual([]);
  });

  it('não tem nomes repetidos', () => {
    const names = MEDICATION_CATALOG.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('escolher um item devolve nome e categoria', () => {
    const onPick = vi.fn();
    render(<CatalogSearch onPick={onPick} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'V10' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: /V10 para cães/ }));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Vacina polivalente V10 para cães', category: 'Vacina' }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
