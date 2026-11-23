const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formata reais no padrão brasileiro (R$ 1.234,56). */
export const brl = (value: number) => currency.format(value);
