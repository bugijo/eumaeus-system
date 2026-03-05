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

// Desativa service workers antigos para evitar cache de chunks quebrados em producao.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))

      if ('caches' in window) {
        const cacheKeys = await caches.keys()
        await Promise.all(
          cacheKeys
            .filter((key) => key.startsWith('eumaeus-'))
            .map((key) => caches.delete(key))
        )
      }
    } catch (error) {
      console.warn('[SW] Cleanup failed:', error)
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
