import React, { useEffect, useState } from 'react';

interface OptimizedLoaderProps {
  message?: string;
  showProgress?: boolean;
  fastTransition?: boolean;
}

export const OptimizedLoader: React.FC<OptimizedLoaderProps> = ({ 
  message = "Carregando...", 
  showProgress = false,
  fastTransition = true 
}) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar loader apenas se demorar mais que 150ms
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, fastTransition ? 50 : 150);

    // Simular progresso se habilitado
    if (showProgress) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 100);

      return () => {
        clearTimeout(showTimer);
        clearInterval(progressInterval);
      };
    }

    return () => clearTimeout(showTimer);
  }, [showProgress, fastTransition]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-[200px] bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4 p-6 rounded-lg bg-card shadow-lg border">
        {/* Spinner otimizado */}
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          {showProgress && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Mensagem */}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {fastTransition ? "Quase pronto..." : "Aguarde um momento"}
          </p>
        </div>
        
        {/* Barra de progresso */}
        {showProgress && (
          <div className="w-48 bg-muted rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Loader específico para navegação rápida
export const FastNavigationLoader: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-primary/20">
        <div className="h-full bg-primary animate-pulse"></div>
      </div>
    </div>
  );
};

// Loader para componentes específicos
export const ComponentLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]}`}></div>
    </div>
  );
};

// Hook para controlar loading states
export function useOptimizedLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingMessage, setLoadingMessage] = useState('Carregando...');

  const startLoading = (message?: string) => {
    if (message) setLoadingMessage(message);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const withLoading = async <T,>(promise: Promise<T>, message?: string): Promise<T> => {
    startLoading(message);
    try {
      const result = await promise;
      stopLoading();
      return result;
    } catch (error) {
      stopLoading();
      throw error;
    }
  };

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  };
}