import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/utils/ErrorBoundary'
import { QueryProvider } from './providers/QueryProvider'

createRoot(document.getElementById('root')!).render(
  <QueryProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </QueryProvider>,
)
