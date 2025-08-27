// Configuração simplificada para frontend Vite

// Configurações padrão para desenvolvimento
const defaultConfig = {
  NODE_ENV: 'development',
  APP_URL: 'http://localhost:3000',
  API_URL: 'http://localhost:3333',
  APP_NAME: 'Eumaeus System',
  APP_VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: '10',
  MAX_PAGE_SIZE: '100',
  CACHE_TTL: '300000',
  ENABLE_DEVTOOLS: 'true',
  LOG_LEVEL: 'info',
  MAX_FILE_SIZE: '5MB',
  ALLOWED_FILE_TYPES: 'image/*,.pdf,.doc,.docx'
};

// Função para obter configurações do ambiente
function getEnvConfig() {
  try {
    // Tenta usar import.meta.env se disponível (Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return {
        NODE_ENV: import.meta.env.MODE || defaultConfig.NODE_ENV,
        APP_URL: import.meta.env.VITE_APP_URL || defaultConfig.APP_URL,
        API_URL: import.meta.env.VITE_API_URL || defaultConfig.API_URL,
        APP_NAME: import.meta.env.VITE_APP_NAME || defaultConfig.APP_NAME,
        APP_VERSION: import.meta.env.VITE_APP_VERSION || defaultConfig.APP_VERSION,
        DEFAULT_PAGE_SIZE: import.meta.env.VITE_DEFAULT_PAGE_SIZE || defaultConfig.DEFAULT_PAGE_SIZE,
        MAX_PAGE_SIZE: import.meta.env.VITE_MAX_PAGE_SIZE || defaultConfig.MAX_PAGE_SIZE,
        CACHE_TTL: import.meta.env.VITE_CACHE_TTL || defaultConfig.CACHE_TTL,
        ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS || defaultConfig.ENABLE_DEVTOOLS,
        LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || defaultConfig.LOG_LEVEL,
        MAX_FILE_SIZE: import.meta.env.VITE_MAX_FILE_SIZE || defaultConfig.MAX_FILE_SIZE,
        ALLOWED_FILE_TYPES: import.meta.env.VITE_ALLOWED_FILE_TYPES || defaultConfig.ALLOWED_FILE_TYPES
      };
    }
  } catch (error) {
    console.warn('⚠️ Erro ao acessar variáveis de ambiente, usando configurações padrão');
  }
  
  return defaultConfig;
}

// Exporta as configurações
export const env = getEnvConfig();

// Exportação para compatibilidade com APIs
export const API_BASE_URL = env.API_URL || 'http://localhost:3333';

// Tipos derivados
export type Environment = typeof env;

// Configurações derivadas das variáveis de ambiente
export const config = {
  app: {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    url: env.APP_URL,
    apiUrl: env.API_URL,
  },
  
  pagination: {
    defaultPageSize: parseInt(env.DEFAULT_PAGE_SIZE),
    maxPageSize: parseInt(env.MAX_PAGE_SIZE),
  },
  
  cache: {
    ttl: parseInt(env.CACHE_TTL),
  },
  
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    allowedTypes: env.ALLOWED_FILE_TYPES.split(','),
  },
  
  development: {
    enableDevtools: env.ENABLE_DEVTOOLS === 'true',
    logLevel: env.LOG_LEVEL,
  },
  
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

// Função para verificar se estamos no lado do cliente
export const isClient = typeof window !== 'undefined';

// Função para verificar se estamos no lado do servidor
export const isServer = !isClient;

// Função para log condicional baseado no ambiente
export const logger = {
  error: (...args: any[]) => {
    if (['error', 'warn', 'info', 'debug'].includes(config.development.logLevel)) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (['warn', 'info', 'debug'].includes(config.development.logLevel)) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (['info', 'debug'].includes(config.development.logLevel)) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (config.development.logLevel === 'debug') {
      console.debug(...args);
    }
  },
};

// Validação adicional para desenvolvimento
if (config.isDevelopment) {
  console.info('🚀 Eumaeus System iniciado em modo de desenvolvimento');
}