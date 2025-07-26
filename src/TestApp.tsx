import React from 'react';
import apiClient from './api/apiClient';

const TestApp: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3, #f3e8ff)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#be185d', marginBottom: '20px' }}>
          🐾 PulseVet System - Teste React
        </h1>
        
        <div style={{
          padding: '15px',
          borderRadius: '10px',
          margin: '10px 0',
          background: '#dcfce7',
          color: '#166534',
          border: '1px solid #bbf7d0'
        }}>
          ✅ React está funcionando!
        </div>
        
        <div style={{
          padding: '15px',
          borderRadius: '10px',
          margin: '10px 0',
          background: '#dbeafe',
          color: '#1e40af',
          border: '1px solid #bfdbfe'
        }}>
          📍 Frontend: http://localhost:3000
        </div>
        
        <div style={{
          padding: '15px',
          borderRadius: '10px',
          margin: '10px 0',
          background: '#dbeafe',
          color: '#1e40af',
          border: '1px solid #bfdbfe'
        }}>
          📍 Backend: http://localhost:3333
        </div>
        
        <button 
          onClick={() => {
            apiClient.get('/tutors')
              .then(response => {
                if (response.status === 200) {
                  alert('✅ Backend conectado com sucesso!');
                } else {
                  alert('⚠️ Backend respondeu com erro');
                }
              })
              .catch(error => {
                alert('❌ Erro ao conectar com backend: ' + error.message);
              });
          }}
          style={{
            background: '#be185d',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '20px'
          }}
        >
          Testar Conexão Backend
        </button>
      </div>
    </div>
  );
};

export default TestApp;