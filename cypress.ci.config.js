const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Configurações otimizadas para CI/CD
    video: true,
    screenshot: true,
    screenshotOnRunFailure: true,
    
    // Timeouts aumentados para ambiente CI
    defaultCommandTimeout: 20000,
    requestTimeout: 20000,
    responseTimeout: 20000,
    pageLoadTimeout: 30000,
    
    // Configurações de viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Configurações de retry para CI
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Configurações de ambiente
    env: {
      apiUrl: process.env.VITE_API_URL || 'https://pulsevet-backend.onrender.com/api',
      frontendUrl: 'http://localhost:3000'
    },
    
    setupNodeEvents(on, config) {
      // Configurações específicas para CI
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
      
      // Configurar variáveis de ambiente
      config.env.apiUrl = process.env.VITE_API_URL || config.env.apiUrl;
      
      return config;
    },
  },
});