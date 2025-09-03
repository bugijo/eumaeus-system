import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
/// <reference types="vitest" />

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Aceitar conexões de qualquer endereço na rede
    port: 3000,
    strictPort: true, // Não mudar automaticamente de porta
    hmr: {
      overlay: false // Desabilitar overlay de erros para melhor UX
    },
    fs: {
      strict: false // Permitir acesso a arquivos fora do root
    }
  },
  // Cache configuration
  cacheDir: 'node_modules/.vite',
  // Evitar recompilações desnecessárias
  define: {
    __DEV__: mode === 'development',
    global: 'globalThis'
  },
  // Expor React globalmente para compatibilidade
  esbuild: {
    define: {
      global: 'globalThis'
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações de performance
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Code splitting otimizado
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('@tanstack') || id.includes('react-query')) {
              return 'query-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('@fullcalendar')) {
              return 'calendar-vendor';
            }
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils-vendor';
            }
            return 'vendor';
          }
          // Páginas principais
          if (id.includes('/pages/Dashboard')) {
            return 'dashboard';
          }
          if (id.includes('/pages/Agendamentos')) {
            return 'agendamentos';
          }
          if (id.includes('/pages/') && (id.includes('Clientes') || id.includes('Tutor'))) {
            return 'clientes';
          }
          if (id.includes('/pages/Pets')) {
            return 'pets';
          }
          if (id.includes('/pages/Estoque')) {
            return 'estoque';
          }
          if (id.includes('/pages/Financeiro')) {
            return 'financeiro';
          }
          if (id.includes('/pages/Prontuario')) {
            return 'prontuario';
          }
          // Componentes por categoria
          if (id.includes('/components/dashboard')) {
            return 'dashboard-components';
          }
          if (id.includes('/components/forms')) {
            return 'forms-components';
          }
          if (id.includes('/components/ui')) {
            return 'ui-components';
          }
        },
        // Otimizar nomes dos chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Configurações de chunk size
    chunkSizeWarningLimit: 1000
  },
  // Otimizações de desenvolvimento
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-label',
      '@radix-ui/react-toast',
      '@radix-ui/react-tabs',
      '@radix-ui/react-card',
      '@radix-ui/react-button',
      '@radix-ui/react-input',
      '@radix-ui/react-textarea',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-switch',
      '@radix-ui/react-slider',
      '@radix-ui/react-progress',
      '@radix-ui/react-avatar',
      '@radix-ui/react-badge',
      '@radix-ui/react-separator',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-popover',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-slot',
      '@tanstack/react-query',
      '@hookform/resolvers',
      'react-hook-form',
      'zod',
      'axios',
      'lucide-react',
      'date-fns',
      'clsx',
      'tailwind-merge',
      '@fullcalendar/core',
      '@fullcalendar/react',
      '@fullcalendar/daygrid',
      '@fullcalendar/timegrid',
      '@fullcalendar/interaction'
    ],
    force: true
  },
  // Configuração do Vitest
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'cypress/'
      ]
    }
  }
}));
