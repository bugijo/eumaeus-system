import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/utils/ErrorBoundary'
import { QueryProvider } from './providers/QueryProvider'

// Expor React globalmente para compatibilidade com testes.
if (typeof window !== 'undefined') {
  (window as any).React = React
}

// Service worker v3: só para instalar o app (PWA). Remove caches das versões antigas.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys()
        await Promise.all(cacheKeys.filter((key) => key.startsWith('eumaeus-') && key !== 'eumaeus-v3').map((key) => caches.delete(key)))
      }
      await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    } catch (error) {
      console.warn('[SW] Falha ao registrar:', error)
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <QueryProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </QueryProvider>,
)
