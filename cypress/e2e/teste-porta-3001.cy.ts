describe('Teste na Porta 3001', () => {
  beforeEach(() => {
    // Configurações de timeout
    Cypress.config('defaultCommandTimeout', 10000);
    Cypress.config('requestTimeout', 10000);
    Cypress.config('responseTimeout', 10000);
  });

  it('deve conseguir acessar a aplicação na porta 3001', () => {
    cy.visit('http://localhost:3001/', {
      timeout: 15000,
      retries: 3
    });
    
    // Aguarda o carregamento da página
    cy.wait(3000);
    
    // Verifica se o elemento root existe
    cy.get('#root', { timeout: 10000 }).should('exist');
    
    // Captura screenshot para verificação
    cy.screenshot('aplicacao-carregada-3001');
  });

  it('deve conseguir navegar para a página de clientes', () => {
    cy.visit('http://localhost:3001/', {
      timeout: 15000,
      retries: 3
    });
    
    // Aguarda o carregamento
    cy.wait(3000);
    
    // Procura pelo link de clientes
    cy.contains('Clientes', { timeout: 10000 }).should('be.visible').click();
    
    // Verifica se navegou para a página correta
    cy.url().should('include', '/clientes');
    
    // Captura screenshot
    cy.screenshot('pagina-clientes-3001');
  });
});