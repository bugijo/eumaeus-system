import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Componente para mostrar em caso de erro
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Você também pode logar o erro para um serviço de monitoramento aqui
    console.error("Erro capturado pelo Error Boundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Se um fallback foi passado, renderiza ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-semibold text-red-800 mb-4">Ops, algo deu errado.</h2>
          <p className="text-red-600 mb-4 text-center">Ocorreu um erro inesperado nesta seção.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;