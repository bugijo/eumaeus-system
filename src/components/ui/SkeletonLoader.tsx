import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-muted rounded';
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded',
    card: 'rounded-lg'
  };

  const style = {
    width: width || (variant === 'circular' ? height : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined)
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses.text,
              animationClasses[animation],
              index === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={{
              width: index === lines - 1 ? '75%' : width,
              height: height || '1rem'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
};

// Skeleton específico para cards do dashboard
export const DashboardCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-lg shadow-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <Skeleton variant="text" width="40%" height={32} />
      <Skeleton variant="text" width="80%" height={16} />
    </div>
  );
};

// Skeleton para lista de agendamentos
export const AppointmentListSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-4 rounded-lg bg-muted/20">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="50%" height={14} />
          </div>
          <div className="space-y-2">
            <Skeleton variant="rectangular" width={60} height={20} />
            <Skeleton variant="text" width={40} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton para tabela
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} variant="text" width="100%" height={20} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              variant="text" 
              width={colIndex === 0 ? "30%" : "100%"} 
              height={16} 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Skeleton para formulário
export const FormSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton variant="text" width="25%" height={16} />
        <Skeleton variant="rectangular" width="100%" height={40} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" width="30%" height={16} />
          <Skeleton variant="rectangular" width="100%" height={40} />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" width="25%" height={16} />
          <Skeleton variant="rectangular" width="100%" height={40} />
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton variant="text" width="20%" height={16} />
        <Skeleton variant="rectangular" width="100%" height={80} />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Skeleton variant="rectangular" width={80} height={36} />
        <Skeleton variant="rectangular" width={100} height={36} />
      </div>
    </div>
  );
};

// Hook para controlar skeleton loading
export function useSkeletonLoading(delay = 200) {
  const [showSkeleton, setShowSkeleton] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading) {
      timer = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      setShowSkeleton(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, delay]);

  return {
    showSkeleton,
    setIsLoading,
    isLoading
  };
}

// Componente wrapper que mostra skeleton ou conteúdo
export const SkeletonWrapper: React.FC<{
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}> = ({ loading, skeleton, children, delay = 200 }) => {
  const { showSkeleton } = useSkeletonLoading(delay);
  
  React.useEffect(() => {
    // Trigger skeleton display based on loading state
  }, [loading]);

  if (loading && showSkeleton) {
    return <>{skeleton}</>;
  }

  if (loading) {
    return null; // Don't show anything during delay
  }

  return <>{children}</>;
};