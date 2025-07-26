import React from 'react';
import apiClient from './api/apiClient';

const DiagnosticApp: React.FC = () => {
  const [errors, setErrors] = React.useState<string[]>([]);
  const [apiStatus, setApiStatus] = React.useState<string>('Testando...');

  React.useEffect(() => {
    // Teste de conectividade com API
    apiClient.get('/tutors')
      .then(response => {
        if (response.status === 200) {
          setApiStatus('✅ API Conectada');
        } else {
          setApiStatus('⚠️ API com erro: ' + response.status);
        }
      })
      .catch(error => {
        setApiStatus('❌ API não conectada: ' + error.message);
      });

    // Capturar erros do console
    const originalError = console.error;
    console.error = (...args) => {
      setErrors(prev => [...prev, args.join(' ')]);
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3, #f3e8ff)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        padding: '30px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#be185d', marginBottom: '30px', textAlign: 'center' }}>
          🔍 Diagnóstico PulseVet System
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Status dos Serviços:</h2>
          <div style={{
            padding: '15px',
            borderRadius: '8px',
            background: '#f0f9ff',
            border: '1px solid #0ea5e9',
            marginBottom: '10px'
          }}>
            <strong>Frontend:</strong> ✅ Rodando em http://localhost:3000
          </div>
          <div style={{
            padding: '15px',
            borderRadius: '8px',
            background: '#f0f9ff',
            border: '1px solid #0ea5e9'
          }}>
            <strong>Backend:</strong> {apiStatus}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Verificações Técnicas:</h2>
          <div style={{
            padding: '15px',
            borderRadius: '8px',
            background: '#f0fdf4',
            border: '1px solid #22c55e',
            marginBottom: '10px'
          }}>
            ✅ React carregado: {typeof React !== 'undefined' ? 'Sim' : 'Não'}
          </div>
          <div style={{
            padding: '15px',
            borderRadius: '8px',
            background: '#f0fdf4',
            border: '1px solid #22c55e',
            marginBottom: '10px'
          }}>
            ✅ DOM disponível: {typeof document !== 'undefined' ? 'Sim' : 'Não'}
          </div>
          <div style={{
            padding: '15px',
            borderRadius: '8px',
            background: '#f0fdf4',
            border: '1px solid #22c55e'
          }}>
            ✅ Elemento root: {document.getElementById('root') ? 'Encontrado' : 'Não encontrado'}
          </div>
        </div>

        {errors.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>Erros Detectados:</h2>
            <div style={{
              padding: '15px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #ef4444',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {errors.map((error, index) => (
                <div key={index} style={{ marginBottom: '5px', fontSize: '14px' }}>
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#be185d',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              marginRight: '10px'
            }}
          >
            🔄 Recarregar Página
          </button>
          <button 
            onClick={() => {
              setErrors([]);
              setApiStatus('Testando...');
            }}
            style={{
              background: '#059669',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🧹 Limpar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticApp;