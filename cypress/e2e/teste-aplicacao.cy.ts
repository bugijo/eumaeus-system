// cypress/e2e/teste-aplicacao.cy.ts

describe('Teste da Aplicação VetSystem', () => {
  it('deve carregar a página inicial da aplicação', () => {
    // Configurar timeouts maiores
    Cypress.config('defaultCommandTimeout', 30000);
    Cypress.config('pageLoadTimeout', 60000);
    
    // Visitar a página principal
    cy.visit('http://localhost:3000/', {
      timeout: 60000,
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true,
      failOnStatusCode: false
    });
    
    // Aguardar a página carregar
    cy.wait(5000);
    
    // Verificar se a página carregou
    cy.get('body').should('be.visible');
    
    // Verificar se há conteúdo na página
    cy.get('body').should('not.be.empty');
    
    // Log da URL atual
    cy.url().then((url) => {
      cy.log('URL atual: ' + url);
    });
    
    // Verificar se não há erros de JavaScript
    cy.window().then((win) => {
      expect(win.console.error).to.not.have.been.called;
    });
  });
  
  it('deve verificar se a aplicação React está funcionando', () => {
    cy.visit('http://localhost:3000/', {
      timeout: 60000,
      failOnStatusCode: false
    });
    
    cy.wait(5000);
    
    // Verificar se há elementos React na página
    cy.get('body').should('exist');
    
    // Verificar se não há mensagens de erro visíveis
    cy.get('body').should('not.contain', 'Error');
    cy.get('body').should('not.contain', 'Cannot');
    
    // Capturar screenshot para debug
    cy.screenshot('aplicacao-carregada');
  });
});