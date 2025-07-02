import React from 'react';

const SimpleTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Teste Simples - Sistema Veterinário</h1>
      <p>Se você está vendo esta mensagem, o React está funcionando!</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Status dos Componentes:</h3>
        <ul>
          <li>✅ React carregado</li>
          <li>✅ DOM renderizado</li>
          <li>✅ CSS básico funcionando</li>
        </ul>
      </div>
      <button 
        onClick={() => alert('Botão funcionando!')} 
        style={{ 
          marginTop: '10px', 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer' 
        }}
      >
        Testar Interação
      </button>
    </div>
  );
};

export default SimpleTest;