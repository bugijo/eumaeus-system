// cypress/e2e/teste-basico.cy.ts

describe('Teste Básico de Conectividade', () => {
  it('deve conseguir acessar a aplicação', () => {
    // Tentar acessar a página principal
    cy.visit('http://localhost:3000/', {
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true,
      timeout: 120000
    });
    
    // Aguardar a página carregar
    cy.wait(5000);
    
    // Verificar se a página carregou (verificar se existe algum elemento HTML básico)
    cy.get('body').should('exist');
    
    // Verificar se o título da página existe
    cy.title().should('not.be.empty');
    
    // Log de sucesso
    cy.log('✅ Aplicação carregou com sucesso!');
  });
  
  it('deve verificar se elementos básicos estão presentes', () => {
    cy.visit('http://localhost:3000/', {
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true,
      timeout: 120000
    });
    
    cy.wait(5000);
    
    // Verificar se existe algum conteúdo na página
    cy.get('body').should('not.be.empty');
    
    // Verificar se existe pelo menos um div
    cy.get('div').should('exist');
    
    cy.log('✅ Elementos básicos encontrados!');
  });
});