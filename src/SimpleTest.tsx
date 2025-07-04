import React from 'react';

const SimpleTest = () => {
  console.log('SimpleTest component is rendering');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>Sistema Veterinário - Teste Simples</h1>
      <p style={{ color: '#666', fontSize: '16px' }}>Se você está vendo esta mensagem, o React está funcionando corretamente.</p>
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e8f5e8', 
        border: '1px solid #4caf50',
        borderRadius: '5px'
      }}>
        <strong>Status:</strong> Componente renderizado com sucesso!
      </div>
    </div>
  );
};

export default SimpleTest;