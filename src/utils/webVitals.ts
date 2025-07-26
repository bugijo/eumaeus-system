import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';
import { logger } from './logger';

interface WebVitalsConfig {
  enableLogging: boolean;
  enableRemoteReporting: boolean;
  remoteEndpoint?: string;
  sampleRate: number; // 0-1, porcentagem de usuários para coletar métricas
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
}

class WebVitalsMonitor {
  private config: WebVitalsConfig;
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean;

  constructor(config: Partial<WebVitalsConfig> = {}) {
    this.config = {
      enableLogging: process.env.NODE_ENV === 'development',
      enableRemoteReporting: process.env.NODE_ENV === 'production',
      sampleRate: 0.1, // 10% dos usuários por padrão
      ...config,
    };

    // Determinar se deve coletar métricas baseado na taxa de amostragem
    this.isEnabled = Math.random() < this.config.sampleRate;

    if (this.isEnabled) {
      this.initializeWebVitals();
      this.setupCustomMetrics();
    }
  }

  private initializeWebVitals(): void {
    // Core Web Vitals
    getCLS(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    
    // Outras métricas importantes
    getFCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));
  }

  private handleMetric(metric: Metric): void {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: this.getRating(metric.name, metric.value),
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceMemory: this.getDeviceMemory(),
    };

    this.metrics.push(performanceMetric);
    this.logMetric(performanceMetric);
    this.reportMetric(performanceMetric);
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    // Thresholds baseados nas recomendações do Google
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      LCP: { good: 2500, poor: 4000 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private getConnectionType(): string | undefined {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType;
  }

  private getDeviceMemory(): number | undefined {
    return (navigator as any).deviceMemory;
  }

  private logMetric(metric: PerformanceMetric): void {
    if (!this.config.enableLogging) return;

    const level = metric.rating === 'poor' ? 'warn' : 'info';
    logger[level](`Web Vital: ${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      url: metric.url,
      connectionType: metric.connectionType,
      deviceMemory: metric.deviceMemory,
      type: 'web_vital',
    });
  }

  private async reportMetric(metric: PerformanceMetric): Promise<void> {
    if (!this.config.enableRemoteReporting || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      logger.warn('Falha ao enviar métrica de performance', { error, metric });
    }
  }

  private setupCustomMetrics(): void {
    // Métrica de tempo de carregamento da página
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.recordCustomMetric('page_load_time', loadTime);
    });

    // Métrica de tempo até interatividade
    document.addEventListener('DOMContentLoaded', () => {
      const domLoadTime = performance.now();
      this.recordCustomMetric('dom_content_loaded', domLoadTime);
    });

    // Métrica de recursos carregados
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');
      const totalResources = resources.length;
      const totalSize = resources.reduce((sum, resource: any) => {
        return sum + (resource.transferSize || 0);
      }, 0);

      this.recordCustomMetric('total_resources', totalResources);
      this.recordCustomMetric('total_transfer_size', totalSize);
    });

    // Métrica de erros JavaScript
    let errorCount = 0;
    window.addEventListener('error', () => {
      errorCount++;
      this.recordCustomMetric('javascript_errors', errorCount);
    });

    // Métrica de tempo de resposta da API
    this.setupApiMetrics();
  }

  private setupApiMetrics(): void {
    // Interceptar fetch para medir tempo de resposta da API
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        
        this.recordCustomMetric('api_response_time', duration, {
          url,
          status: response.status,
          method: args[1]?.method || 'GET',
        });
        
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        
        this.recordCustomMetric('api_error_time', duration, {
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
          method: args[1]?.method || 'GET',
        });
        
        throw error;
      }
    };
  }

  public recordCustomMetric(name: string, value: number, context?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      rating: 'good', // Métricas customizadas não têm rating automático
      delta: value,
      id: `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceMemory: this.getDeviceMemory(),
    };

    this.metrics.push(metric);
    
    logger.performance(name, value, 'ms');
    
    if (context) {
      logger.info(`Métrica customizada: ${name}`, {
        value,
        ...context,
        type: 'custom_metric',
      });
    }

    this.reportMetric(metric);
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  public getAverageMetric(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;
    
    const sum = metrics.reduce((total, metric) => total + metric.value, 0);
    return sum / metrics.length;
  }

  public getMetricSummary(): Record<string, { count: number; average: number; min: number; max: number }> {
    const summary: Record<string, { count: number; average: number; min: number; max: number }> = {};
    
    const metricNames = [...new Set(this.metrics.map(m => m.name))];
    
    metricNames.forEach(name => {
      const metrics = this.getMetricsByName(name);
      const values = metrics.map(m => m.value);
      
      summary[name] = {
        count: metrics.length,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });
    
    return summary;
  }

  public exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: this.getMetricSummary(),
      timestamp: Date.now(),
      url: window.location.href,
    }, null, 2);
  }

  public clearMetrics(): void {
    this.metrics = [];
  }
}

// Instância global do monitor
export const webVitalsMonitor = new WebVitalsMonitor();

// Hook para usar métricas em componentes React
import { useEffect, useCallback } from 'react';

export function useWebVitals(componentName?: string) {
  const recordMetric = useCallback(
    (name: string, value: number, context?: Record<string, any>) => {
      const metricName = componentName ? `${componentName}_${name}` : name;
      webVitalsMonitor.recordCustomMetric(metricName, value, context);
    },
    [componentName]
  );

  const recordRenderTime = useCallback(() => {
    const start = performance.now();
    
    return () => {
      const renderTime = performance.now() - start;
      recordMetric('render_time', renderTime);
    };
  }, [recordMetric]);

  return {
    recordMetric,
    recordRenderTime,
    getMetrics: webVitalsMonitor.getMetrics.bind(webVitalsMonitor),
    getMetricSummary: webVitalsMonitor.getMetricSummary.bind(webVitalsMonitor),
  };
}

// HOC para medir performance de componentes
import React from 'react';

export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const PerformanceMonitoredComponent: React.FC<P> = (props) => {
    const { recordRenderTime } = useWebVitals(displayName);
    
    useEffect(() => {
      const endRenderTime = recordRenderTime();
      return endRenderTime;
    });
    
    return React.createElement(WrappedComponent, props);
  };
  
  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return PerformanceMonitoredComponent;
}

export default webVitalsMonitor;