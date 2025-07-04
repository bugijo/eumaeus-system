import React, { useState } from 'react';

interface BuggyComponentProps {
  shouldThrow?: boolean;
}

const BuggyComponent: React.FC<BuggyComponentProps> = ({ shouldThrow = false }) => {
  const [throwError, setThrowError] = useState(shouldThrow);

  if (throwError) {
    throw new Error('💥 BOOM! Este é um erro de teste para demonstrar o Error Boundary.');
  }

  return (
    <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">🧪 Componente de Teste</h3>
      <p className="text-yellow-700 mb-4">
        Este componente pode gerar um erro para testar nossos Error Boundaries.
      </p>
      <button
        onClick={() => setThrowError(true)}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        💥 Gerar Erro de Teste
      </button>
    </div>
  );
};

export default BuggyComponent;