import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/utils/ErrorBoundary'
import { QueryProvider } from './providers/QueryProvider'

// Expor React globalmente para compatibilidade com testes
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

// Registrar Service Worker para cache avançado
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered successfully:', registration.scope);
        
        // Limpar cache expirado a cada 30 minutos
        setInterval(() => {
          if (registration.active) {
            registration.active.postMessage({ type: 'CLEAN_CACHE' });
          }
        }, 30 * 60 * 1000);
      })
      .catch((error) => {
        console.log('[SW] Registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <QueryProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </QueryProvider>,
)
