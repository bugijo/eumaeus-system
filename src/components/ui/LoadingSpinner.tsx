import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'white';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const colorClasses = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white'
};

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  color = 'primary' 
}: LoadingSpinnerProps) {
  return (
    <svg
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Componente de Loading com texto
interface LoadingWithTextProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingWithText({ 
  text = 'Carregando...', 
  size = 'md',
  className 
}: LoadingWithTextProps) {
  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <LoadingSpinner size={size} />
      <span className="text-gray-600">{text}</span>
    </div>
  );
}

// Componente de Loading para página inteira
interface FullPageLoadingProps {
  text?: string;
}

export function FullPageLoading({ text = 'Carregando...' }: FullPageLoadingProps) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-lg text-gray-600">{text}</p>
      </div>
    </div>
  );
}

// Componente de Loading para botões
interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function ButtonLoading({ 
  isLoading, 
  children, 
  loadingText,
  className,
  disabled,
  onClick 
}: ButtonLoadingProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading && <LoadingSpinner size="sm" color="white" />}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </button>
  );
}

// Export default para compatibilidade com importações sem chaves
export default LoadingSpinner;