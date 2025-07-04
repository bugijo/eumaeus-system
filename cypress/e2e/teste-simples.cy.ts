describe('Teste Básico do Cypress', () => {
  it('deve executar um teste simples', () => {
    // Teste básico que sempre passa
    expect(true).to.be.true;
    expect(1 + 1).to.equal(2);
  });

  it('deve conseguir acessar localhost:3000', () => {
    cy.visit('http://localhost:3000/', { 
      timeout: 30000,
      failOnStatusCode: false 
    });
    
    // Verifica se conseguiu carregar alguma coisa
    cy.get('body').should('exist');
  });
});