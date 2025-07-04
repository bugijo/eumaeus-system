const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 60000,
    requestTimeout: 60000,
    responseTimeout: 60000,
    pageLoadTimeout: 120000,
    retries: {
      runMode: 2,
      openMode: 1
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});