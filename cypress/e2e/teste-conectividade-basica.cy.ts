// cypress/e2e/teste-conectividade-basica.cy.ts

describe('Teste de Conectividade Básica', () => {
  it('deve conseguir acessar o frontend', () => {
    cy.visit('http://localhost:3000/');
    cy.get('body').should('be.visible');
  });

  it('deve conseguir acessar o backend', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:3333/api/tutors',
      failOnStatusCode: false
    }).then((response) => {
      // Aceita tanto 200 (sucesso) quanto 404 (rota não encontrada mas servidor respondeu)
      expect(response.status).to.be.oneOf([200, 404]);
    });
  });

  it('deve conseguir navegar para a página de agendamentos', () => {
    cy.visit('http://localhost:3000/');
    cy.get('body').should('be.visible');
    
    // Tentar encontrar link para agendamentos
    cy.contains('Agendamentos', { timeout: 10000 }).should('be.visible').click();
    
    // Verificar se chegou na página de agendamentos
    cy.url().should('include', '/agendamentos');
  });
});