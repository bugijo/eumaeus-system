// Constantes do sistema

// Status de agendamento
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
} as const;

export const APPOINTMENT_STATUS_LABELS = {
  [APPOINTMENT_STATUS.SCHEDULED]: 'Agendado',
  [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmado',
  [APPOINTMENT_STATUS.CANCELLED]: 'Cancelado',
  [APPOINTMENT_STATUS.COMPLETED]: 'Concluído'
} as const;

export const APPOINTMENT_STATUS_COLORS = {
  [APPOINTMENT_STATUS.SCHEDULED]: 'blue',
  [APPOINTMENT_STATUS.CONFIRMED]: 'green',
  [APPOINTMENT_STATUS.CANCELLED]: 'red',
  [APPOINTMENT_STATUS.COMPLETED]: 'gray'
} as const;

// Espécies de animais mais comuns
export const COMMON_SPECIES = [
  'Cachorro',
  'Gato',
  'Pássaro',
  'Peixe',
  'Hamster',
  'Coelho',
  'Tartaruga',
  'Ferret',
  'Chinchila',
  'Porquinho-da-índia',
  'Outro'
] as const;

// Raças mais comuns por espécie
export const COMMON_BREEDS = {
  Cachorro: [
    'Labrador',
    'Golden Retriever',
    'Bulldog Francês',
    'Pastor Alemão',
    'Beagle',
    'Poodle',
    'Rottweiler',
    'Yorkshire Terrier',
    'Boxer',
    'Dachshund',
    'Shih Tzu',
    'Border Collie',
    'Husky Siberiano',
    'Chihuahua',
    'Maltês',
    'SRD (Sem Raça Definida)'
  ],
  Gato: [
    'Persa',
    'Siamês',
    'Maine Coon',
    'Ragdoll',
    'British Shorthair',
    'Abissínio',
    'Bengala',
    'Russian Blue',
    'Sphynx',
    'Scottish Fold',
    'Angorá',
    'SRD (Sem Raça Definida)'
  ],
  Pássaro: [
    'Canário',
    'Periquito',
    'Calopsita',
    'Papagaio',
    'Agapornis',
    'Diamante Gould',
    'Curió',
    'Sabiá',
    'Bem-te-vi'
  ],
  Peixe: [
    'Betta',
    'Guppy',
    'Neon',
    'Acará',
    'Kinguio',
    'Carpa',
    'Tetra',
    'Platy',
    'Molly'
  ]
} as const;

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  LIMITS: [5, 10, 20, 50, 100]
} as const;

// Configurações de validação
export const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  PHONE_REGEX: /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/,
  ADDRESS_MAX_LENGTH: 500,
  SPECIES_MAX_LENGTH: 50,
  BREED_MAX_LENGTH: 100
} as const;

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo é obrigatório',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Telefone inválido (ex: (11) 99999-9999)',
  MIN_LENGTH: (min: number) => `Deve ter pelo menos ${min} caracteres`,
  MAX_LENGTH: (max: number) => `Deve ter no máximo ${max} caracteres`,
  FUTURE_DATE: 'Data não pode ser no futuro',
  NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
  GENERIC_ERROR: 'Ocorreu um erro inesperado. Tente novamente.',
  NOT_FOUND: 'Registro não encontrado',
  UNAUTHORIZED: 'Acesso não autorizado',
  FORBIDDEN: 'Operação não permitida',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  DELETE_WITH_DEPENDENCIES: 'Não é possível excluir registro com dependências'
} as const;

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  CREATED: 'Registro criado com sucesso!',
  UPDATED: 'Registro atualizado com sucesso!',
  DELETED: 'Registro excluído com sucesso!',
  SAVED: 'Dados salvos com sucesso!'
} as const;

// Configurações de tempo
export const TIME_CONFIG = {
  QUERY_STALE_TIME: 5 * 60 * 1000, // 5 minutos
  QUERY_GC_TIME: 10 * 60 * 1000, // 10 minutos
  STATS_STALE_TIME: 10 * 60 * 1000, // 10 minutos
  STATS_GC_TIME: 30 * 60 * 1000, // 30 minutos
  DEBOUNCE_DELAY: 300, // 300ms
  TOAST_DURATION: 5000 // 5 segundos
} as const;

// Configurações de formatação
export const FORMAT_CONFIG = {
  DATE_FORMAT: 'dd/MM/yyyy',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',
  TIME_FORMAT: 'HH:mm',
  CURRENCY_LOCALE: 'pt-BR',
  CURRENCY: 'BRL'
} as const;

// Cores do tema
export const THEME_COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#6B7280',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6'
} as const;

// Breakpoints responsivos
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px'
} as const;

// Configurações de upload (para futuro uso)
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
} as const;

// Configurações de busca
export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_RECENT_SEARCHES: 5
} as const;

export type AppointmentStatus = keyof typeof APPOINTMENT_STATUS;
export type CommonSpecies = typeof COMMON_SPECIES[number];
export type CommonBreed = typeof COMMON_BREEDS[keyof typeof COMMON_BREEDS][number];