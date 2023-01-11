module.exports = require('cypress').defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    retries: 2,
    defaultCommandTimeout: 10000,
  },
});
