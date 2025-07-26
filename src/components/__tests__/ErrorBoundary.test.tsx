import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { logger } from '../../utils/logger';

// Mock do logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Componente que gera erro para teste
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Erro de teste');
  }
  return <div>Componente funcionando</div>;
};

// Mock do console.error para evitar logs desnecessários nos testes
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Componente funcionando')).toBeInTheDocument();
  });

  it('deve renderizar UI de fallback quando há erro', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText('Ocorreu um erro inesperado. Nossa equipe foi notificada.')).toBeInTheDocument();
    expect(screen.getByText('Recarregar página')).toBeInTheDocument();
  });

  it('deve chamar logger.error quando um erro ocorre', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(logger.error).toHaveBeenCalledWith(
      'Erro capturado pelo Error Boundary',
      expect.objectContaining({
        error: expect.any(Error),
        errorInfo: expect.objectContaining({
          componentStack: expect.any(String),
        }),
        url: expect.any(String),
        userAgent: expect.any(String),
        timestamp: expect.any(String),
      })
    );
  });

  it('deve renderizar fallback customizado quando fornecido', () => {
    const CustomFallback = () => <div>Erro customizado</div>;

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Erro customizado')).toBeInTheDocument();
    expect(screen.queryByText('Ops! Algo deu errado')).not.toBeInTheDocument();
  });

  it('deve chamar onError quando fornecido', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('deve resetar estado quando children mudam', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verifica se está mostrando o erro
    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();

    // Muda os children
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Verifica se voltou ao estado normal
    expect(screen.getByText('Componente funcionando')).toBeInTheDocument();
    expect(screen.queryByText('Ops! Algo deu errado')).not.toBeInTheDocument();
  });

  it('deve incluir informações de desenvolvimento quando NODE_ENV é development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Detalhes do erro:')).toBeInTheDocument();
    expect(screen.getByText('Erro de teste')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('não deve mostrar detalhes do erro em produção', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Detalhes do erro:')).not.toBeInTheDocument();
    expect(screen.queryByText('Erro de teste')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('deve recarregar a página quando botão é clicado', () => {
    // Mock do window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: {
        reload: mockReload,
      },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Recarregar página');
    reloadButton.click();

    expect(mockReload).toHaveBeenCalled();
  });
});