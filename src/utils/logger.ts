type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  stack?: string;
}

interface LoggerConfig {
  enableConsole: boolean;
  enableRemote: boolean;
  minLevel: LogLevel;
  remoteEndpoint?: string;
  maxLocalLogs: number;
}

class Logger {
  private config: LoggerConfig;
  private localLogs: LogEntry[] = [];
  private sessionId: string;
  private userId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableConsole: process.env.NODE_ENV === 'development',
      enableRemote: process.env.NODE_ENV === 'production',
      minLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      maxLocalLogs: 1000,
      ...config,
    };
    
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Capturar erros JavaScript não tratados
    window.addEventListener('error', (event) => {
      this.error('Erro JavaScript não tratado', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Capturar promises rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Promise rejeitada não tratada', {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.config.minLevel);
    return currentLevelIndex >= minLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      stack: level === 'error' ? new Error().stack : undefined,
    };
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const style = this.getConsoleStyle(entry.level);
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    
    console.group(`%c${prefix}`, style);
    console.log(entry.message);
    
    if (entry.context) {
      console.log('Context:', entry.context);
    }
    
    if (entry.stack && entry.level === 'error') {
      console.log('Stack:', entry.stack);
    }
    
    console.groupEnd();
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6B7280; font-weight: normal;',
      info: 'color: #3B82F6; font-weight: bold;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
    };
    return styles[level];
  }

  private storeLocally(entry: LogEntry): void {
    this.localLogs.push(entry);
    
    // Manter apenas os logs mais recentes
    if (this.localLogs.length > this.config.maxLocalLogs) {
      this.localLogs = this.localLogs.slice(-this.config.maxLocalLogs);
    }
    
    // Armazenar no localStorage para persistência
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.localLogs.slice(-100)));
    } catch (error) {
      // Ignorar erros de localStorage (quota excedida, etc.)
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Falha silenciosa para não afetar a aplicação
      console.warn('Falha ao enviar log para servidor:', error);
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context);
    
    this.logToConsole(entry);
    this.storeLocally(entry);
    
    if (level === 'error' || level === 'warn') {
      this.sendToRemote(entry);
    }
  }

  // Métodos públicos
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  // Métodos especializados
  apiCall(method: string, url: string, status: number, duration: number): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.log(level, `API ${method} ${url}`, {
      method,
      url,
      status,
      duration,
      type: 'api_call',
    });
  }

  userAction(action: string, details?: Record<string, any>): void {
    this.info(`Ação do usuário: ${action}`, {
      action,
      ...details,
      type: 'user_action',
    });
  }

  performance(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`Performance: ${metric}`, {
      metric,
      value,
      unit,
      type: 'performance',
    });
  }

  // Configuração
  setUserId(userId: string): void {
    this.userId = userId;
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Utilitários
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.localLogs.filter(log => log.level === level);
    }
    return [...this.localLogs];
  }

  clearLogs(): void {
    this.localLogs = [];
    localStorage.removeItem('app_logs');
  }

  exportLogs(): string {
    return JSON.stringify(this.localLogs, null, 2);
  }

  // Método para criar contexto de log específico
  createContext(baseContext: Record<string, any>) {
    return {
      debug: (message: string, context?: Record<string, any>) => 
        this.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: Record<string, any>) => 
        this.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: Record<string, any>) => 
        this.warn(message, { ...baseContext, ...context }),
      error: (message: string, context?: Record<string, any>) => 
        this.error(message, { ...baseContext, ...context }),
    };
  }
}

// Instância global do logger
export const logger = new Logger();

// Hook para usar logger em componentes React
import { useCallback, useEffect } from 'react';

export function useLogger(componentName: string) {
  const componentLogger = useCallback(
    () => logger.createContext({ component: componentName }),
    [componentName]
  );

  useEffect(() => {
    logger.debug(`Componente ${componentName} montado`);
    
    return () => {
      logger.debug(`Componente ${componentName} desmontado`);
    };
  }, [componentName]);

  return componentLogger();
}

// Decorator para logar chamadas de função
export function logFunction(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    logger.debug(`Executando ${propertyName}`, { args });
    
    try {
      const result = method.apply(this, args);
      
      if (result instanceof Promise) {
        return result
          .then((res) => {
            const duration = performance.now() - start;
            logger.debug(`${propertyName} concluído`, { duration, result: res });
            return res;
          })
          .catch((error) => {
            const duration = performance.now() - start;
            logger.error(`${propertyName} falhou`, { duration, error });
            throw error;
          });
      } else {
        const duration = performance.now() - start;
        logger.debug(`${propertyName} concluído`, { duration, result });
        return result;
      }
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`${propertyName} falhou`, { duration, error });
      throw error;
    }
  };

  return descriptor;
}

export default logger;