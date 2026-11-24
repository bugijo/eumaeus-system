/**
 * Catálogo inicial para agilizar o cadastro de estoque.
 * Princípio ativo, concentração e forma, sem marca comercial. Não é bula nem orientação de uso:
 * o estabelecimento confere a apresentação do produto que comprou antes de salvar.
 */
export type CatalogCategory = 'Medicamento' | 'Vacina' | 'Material clínico';

export interface CatalogItem {
  name: string;
  category: CatalogCategory;
  group: string;
}

const med = (group: string, names: string[]): CatalogItem[] => names.map((name) => ({ name, category: 'Medicamento', group }));
const mat = (names: string[]): CatalogItem[] => names.map((name) => ({ name, category: 'Material clínico', group: 'Material clínico' }));
const vac = (names: string[]): CatalogItem[] => names.map((name) => ({ name, category: 'Vacina', group: 'Vacinas' }));

export const MEDICATION_CATALOG: CatalogItem[] = [
  ...med('Antibióticos', [
    'Amoxicilina + clavulanato de potássio 250 mg comprimido',
    'Amoxicilina + clavulanato de potássio 500 mg comprimido',
    'Cefalexina 300 mg comprimido',
    'Cefalexina 600 mg comprimido',
    'Doxiciclina 100 mg comprimido',
    'Enrofloxacino 50 mg comprimido',
    'Enrofloxacino 150 mg comprimido',
    'Enrofloxacino 10% injetável',
    'Metronidazol 250 mg comprimido',
    'Metronidazol 400 mg comprimido',
    'Sulfametoxazol + trimetoprima 400 mg + 80 mg comprimido',
    'Ceftriaxona 1 g pó para injetável',
    'Benzilpenicilina benzatina injetável',
  ]),
  ...med('Anti-inflamatórios e analgésicos', [
    'Meloxicam 0,5 mg comprimido',
    'Meloxicam 2 mg comprimido',
    'Meloxicam 0,2% injetável',
    'Carprofeno 25 mg comprimido',
    'Carprofeno 75 mg comprimido',
    'Carprofeno 100 mg comprimido',
    'Firocoxibe 57 mg comprimido',
    'Firocoxibe 227 mg comprimido',
    'Cetoprofeno 1% injetável',
    'Dipirona 500 mg/ml gotas',
    'Dipirona 500 mg/ml injetável',
    'Tramadol 50 mg comprimido',
    'Tramadol 50 mg/ml injetável',
    'Gabapentina 100 mg cápsula',
    'Prednisolona 5 mg comprimido',
    'Prednisolona 20 mg comprimido',
    'Dexametasona 2 mg/ml injetável',
  ]),
  ...med('Antiparasitários', [
    'Ivermectina 1% injetável',
    'Praziquantel + pirantel + febantel comprimido para cães até 10 kg',
    'Praziquantel + pirantel comprimido para gatos',
    'Fluralaner comprimido para cães de 10 a 20 kg',
    'Afoxolaner comprimido para cães de 10 a 25 kg',
    'Sarolaner comprimido para cães de 10 a 20 kg',
    'Fipronil pipeta para cães de 10 a 20 kg',
    'Selamectina pipeta para gatos até 7,5 kg',
    'Imidacloprida + flumetrina coleira para cães acima de 8 kg',
    'Toltrazurila 5% suspensão oral',
    'Fenbendazol suspensão oral',
  ]),
  ...med('Gastrointestinal', [
    'Omeprazol 10 mg cápsula',
    'Omeprazol 20 mg cápsula',
    'Ondansetrona 4 mg comprimido',
    'Ondansetrona 2 mg/ml injetável',
    'Metoclopramida 10 mg comprimido',
    'Metoclopramida 5 mg/ml injetável',
    'Citrato de maropitant 10 mg/ml injetável',
    'Citrato de maropitant 16 mg comprimido',
    'Citrato de maropitant 24 mg comprimido',
    'Sucralfato 1 g comprimido',
    'Simeticona 75 mg/ml gotas',
    'Probiótico pasta oral',
  ]),
  ...med('Dermatologia e otologia', [
    'Oclacitinib 3,6 mg comprimido',
    'Oclacitinib 5,4 mg comprimido',
    'Oclacitinib 16 mg comprimido',
    'Cetoconazol 200 mg comprimido',
    'Itraconazol 100 mg cápsula',
    'Clorexidina 2% shampoo',
    'Clorexidina 2% solução tópica',
    'Solução otológica de limpeza',
  ]),
  ...med('Cardiologia, nefrologia e endocrinologia', [
    'Pimobendan 1,25 mg comprimido',
    'Pimobendan 5 mg comprimido',
    'Benazepril 5 mg comprimido',
    'Enalapril 5 mg comprimido',
    'Enalapril 10 mg comprimido',
    'Furosemida 40 mg comprimido',
    'Furosemida 10 mg/ml injetável',
    'Espironolactona 25 mg comprimido',
    'Insulina NPH humana 100 UI/ml',
    'Insulina suína lenta 40 UI/ml',
    'Fenobarbital 100 mg comprimido',
    'Fenobarbital 40 mg/ml gotas',
  ]),
  ...med('Anestesia e sedação', [
    'Cetamina 10% injetável',
    'Xilazina 2% injetável',
    'Dexmedetomidina 0,5 mg/ml injetável',
    'Propofol 1% injetável',
    'Midazolam 5 mg/ml injetável',
    'Acepromazina 0,2% injetável',
    'Acepromazina 1% gotas',
    'Lidocaína 2% sem vasoconstritor injetável',
    'Isoflurano 100 ml',
  ]),
  ...med('Fluidoterapia e suplementos', [
    'Ringer com lactato 500 ml',
    'Cloreto de sódio 0,9% 500 ml',
    'Glicose 5% 500 ml',
    'Complexo B injetável',
    'Ômega 3 cápsula',
    'Glucosamina + condroitina comprimido',
  ]),
  ...mat([
    'Cateter intravenoso 22G',
    'Cateter intravenoso 24G',
    'Seringa descartável 3 ml',
    'Seringa descartável 5 ml',
    'Agulha descartável 25 x 7',
    'Equipo macrogotas',
    'Atadura de crepom 10 cm',
    'Compressa de gaze estéril',
    'Esparadrapo 10 cm x 4,5 m',
    'Fio de náilon 3-0 com agulha',
    'Luva de procedimento (caixa com 100)',
  ]),
  ...vac([
    'Vacina polivalente V8 para cães',
    'Vacina polivalente V10 para cães',
    'Vacina antirrábica',
    'Vacina contra tosse dos canis (Bordetella + parainfluenza)',
    'Vacina contra giardíase para cães',
    'Vacina quádrupla felina (V4)',
    'Vacina quíntupla felina (V5)',
  ]),
];

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Busca por partes do nome, sem acento e sem diferença de maiúsculas. */
export function searchCatalog(query: string, limit = 8): CatalogItem[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length || terms.join('').length < 2) return [];
  return MEDICATION_CATALOG
    .filter((item) => { const text = normalize(`${item.name} ${item.group}`); return terms.every((term) => text.includes(term)); })
    .slice(0, limit);
}
