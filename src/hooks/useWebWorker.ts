import { useEffect, useRef, useState, useCallback } from 'react';

interface WebWorkerTask {
  id: string;
  type: string;
  data: any;
  searchTerm?: string;
  filters?: Record<string, any>;
}

interface WebWorkerResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTime?: number;
}

interface UseWebWorkerReturn {
  processData: (type: string, data: any, options?: { searchTerm?: string; filters?: Record<string, any> }) => Promise<WebWorkerResult>;
  isProcessing: boolean;
  clearCache: () => void;
  getStats: () => Promise<any>;
  terminate: () => void;
}

export function useWebWorker(workerPath = '/workers/dataProcessor.js'): UseWebWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingTasks = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());
  const taskCounter = useRef(0);

  // Inicializar worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(workerPath);
        
        workerRef.current.onmessage = (event) => {
          const { type, taskId, result, data, error } = event.data;
          
          switch (type) {
            case 'WORKER_READY':
              console.log('[WebWorker] Data processor ready');
              break;
              
            case 'TASK_COMPLETE':
              const pendingTask = pendingTasks.current.get(taskId);
              if (pendingTask) {
                pendingTasks.current.delete(taskId);
                pendingTask.resolve(result);
              }
              
              // Atualizar status de processamento
              if (pendingTasks.current.size === 0) {
                setIsProcessing(false);
              }
              break;
              
            case 'CACHE_CLEARED':
              console.log('[WebWorker] Cache cleared');
              break;
              
            case 'WORKER_STATS':
              const statsTask = pendingTasks.current.get(taskId);
              if (statsTask) {
                pendingTasks.current.delete(taskId);
                statsTask.resolve(data);
              }
              break;
              
            case 'ERROR':
              const errorTask = pendingTasks.current.get(taskId);
              if (errorTask) {
                pendingTasks.current.delete(taskId);
                errorTask.reject(new Error(error));
              }
              break;
          }
        };
        
        workerRef.current.onerror = (error) => {
          console.error('[WebWorker] Error:', error);
          // Rejeitar todas as tarefas pendentes
          pendingTasks.current.forEach(({ reject }) => {
            reject(new Error('Worker error'));
          });
          pendingTasks.current.clear();
          setIsProcessing(false);
        };
        
      } catch (error) {
        console.warn('[WebWorker] Not supported or failed to initialize:', error);
      }
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [workerPath]);

  const processData = useCallback(async (
    type: string, 
    data: any, 
    options: { searchTerm?: string; filters?: Record<string, any> } = {}
  ): Promise<WebWorkerResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        // Fallback para processamento síncrono se worker não disponível
        console.warn('[WebWorker] Worker not available, using fallback processing');
        resolve(fallbackProcessing(type, data, options));
        return;
      }
      
      const taskId = `task_${++taskCounter.current}_${Date.now()}`;
      
      // Armazenar callbacks para resolução
      pendingTasks.current.set(taskId, { resolve, reject });
      
      // Enviar tarefa para o worker
      workerRef.current.postMessage({
        type: 'QUEUE_TASK',
        taskId,
        data: {
          type,
          data,
          searchTerm: options.searchTerm,
          filters: options.filters
        }
      });
      
      setIsProcessing(true);
      
      // Timeout para evitar travamento
      setTimeout(() => {
        if (pendingTasks.current.has(taskId)) {
          pendingTasks.current.delete(taskId);
          reject(new Error('Task timeout'));
          
          if (pendingTasks.current.size === 0) {
            setIsProcessing(false);
          }
        }
      }, 30000); // 30 segundos timeout
    });
  }, []);

  const clearCache = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'CLEAR_CACHE',
        taskId: `clear_${Date.now()}`
      });
    }
  }, []);

  const getStats = useCallback((): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        resolve({ cacheSize: 0, queueLength: 0, isProcessing: false });
        return;
      }
      
      const taskId = `stats_${Date.now()}`;
      pendingTasks.current.set(taskId, { resolve, reject });
      
      workerRef.current.postMessage({
        type: 'GET_STATS',
        taskId
      });
    });
  }, []);

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      
      // Rejeitar todas as tarefas pendentes
      pendingTasks.current.forEach(({ reject }) => {
        reject(new Error('Worker terminated'));
      });
      pendingTasks.current.clear();
      setIsProcessing(false);
    }
  }, []);

  return {
    processData,
    isProcessing,
    clearCache,
    getStats,
    terminate
  };
}

// Processamento fallback quando Web Worker não está disponível
function fallbackProcessing(
  type: string, 
  data: any, 
  options: { searchTerm?: string; filters?: Record<string, any> }
): WebWorkerResult {
  const startTime = performance.now();
  
  try {
    switch (type) {
      case 'PROCESS_APPOINTMENTS':
        return {
          success: true,
          data: {
            processed: data,
            stats: { total: data.length }
          },
          processingTime: performance.now() - startTime
        };
        
      case 'PROCESS_PETS':
        return {
          success: true,
          data: {
            processed: data,
            stats: { total: data.length }
          },
          processingTime: performance.now() - startTime
        };
        
      case 'ADVANCED_SEARCH':
        let results = [...data];
        
        // Busca simples
        if (options.searchTerm) {
          const term = options.searchTerm.toLowerCase();
          results = results.filter(item => 
            Object.values(item).some(value => 
              value?.toString().toLowerCase().includes(term)
            )
          );
        }
        
        return {
          success: true,
          data: {
            results,
            totalFound: results.length,
            searchTerm: options.searchTerm,
            filters: options.filters
          },
          processingTime: performance.now() - startTime
        };
        
      default:
        return {
          success: false,
          error: `Unknown task type: ${type}`,
          processingTime: performance.now() - startTime
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: performance.now() - startTime
    };
  }
}

// Hook específico para processamento de dados do dashboard
export function useDashboardProcessor() {
  const { processData, isProcessing } = useWebWorker();
  
  const processAppointments = useCallback(async (appointments: any[]) => {
    return processData('PROCESS_APPOINTMENTS', appointments);
  }, [processData]);
  
  const processPets = useCallback(async (pets: any[]) => {
    return processData('PROCESS_PETS', pets);
  }, [processData]);
  
  const processFinancialData = useCallback(async (invoices: any[]) => {
    return processData('PROCESS_FINANCIAL', invoices);
  }, [processData]);
  
  const searchData = useCallback(async (
    data: any[], 
    searchTerm: string, 
    filters: Record<string, any> = {}
  ) => {
    return processData('ADVANCED_SEARCH', data, { searchTerm, filters });
  }, [processData]);
  
  return {
    processAppointments,
    processPets,
    processFinancialData,
    searchData,
    isProcessing
  };
}