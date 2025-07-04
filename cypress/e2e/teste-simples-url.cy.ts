// cypress/e2e/teste-simples-url.cy.ts

describe('Teste Simples de URL', () => {
  it('deve conseguir acessar localhost:3000', () => {
    // Configurações básicas
    Cypress.config('defaultCommandTimeout', 10000);
    Cypress.config('pageLoadTimeout', 30000);
    
    // Tentar acessar a URL
    cy.request({
      url: 'http://localhost:3000/',
      failOnStatusCode: false,
      timeout: 30000
    }).then((response) => {
      // Verificar se a resposta não é um erro de conexão
      expect(response.status).to.be.oneOf([200, 404, 500]); // Qualquer resposta HTTP válida
      cy.log('Status da resposta: ' + response.status);
    });
  });
  
  it('deve conseguir visitar a página', () => {
    cy.visit('http://localhost:3000/', {
      timeout: 30000,
      failOnStatusCode: false,
      retryOnStatusCodeFailure: false,
      retryOnNetworkFailure: false
    });
    
    // Aguardar um pouco
    cy.wait(3000);
    
    // Verificar se pelo menos o body existe
    cy.get('body', { timeout: 10000 }).should('exist');
    
    // Capturar screenshot
    cy.screenshot('pagina-acessada');
  });
});