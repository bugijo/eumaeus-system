import { useId, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CatalogItem, MEDICATION_CATALOG, searchCatalog } from '@/data/medicationCatalog';

/** Busca no catálogo de medicamentos e materiais: escolher um item preenche nome e categoria. */
export default function CatalogSearch({ onPick }: { onPick: (item: CatalogItem) => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const results = searchCatalog(query);

  const pick = (item: CatalogItem) => {
    onPick(item);
    setQuery('');
    setActive(0);
  };

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] p-4">
      <label htmlFor={`${listId}-input`} className="text-sm font-medium">Buscar no catálogo</label>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {MEDICATION_CATALOG.length} medicamentos, vacinas e materiais já cadastrados. Escolha um para preencher o nome e a categoria, e confira a apresentação do produto que você comprou.
      </p>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={`${listId}-input`}
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          className="pl-9"
          placeholder="Ex.: meloxicam, V10, cateter"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActive(0); }}
          onKeyDown={(event) => {
            if (!results.length) return;
            if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => (i + 1) % results.length); }
            if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => (i - 1 + results.length) % results.length); }
            if (event.key === 'Enter') { event.preventDefault(); pick(results[active]); }
            if (event.key === 'Escape') setQuery('');
          }}
        />
        {results.length > 0 && (
          <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
            {results.map((item, index) => (
              <li
                key={item.name}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => { event.preventDefault(); pick(item); }}
                onMouseEnter={() => setActive(index)}
                className={`cursor-pointer rounded-md px-3 py-2 text-sm ${index === active ? 'bg-muted' : ''}`}
              >
                <span className="block">{item.name}</span>
                <span className="block text-xs text-muted-foreground">{item.group}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
