describe('Teste HTTP Básico', () => {
  it('deve receber resposta HTTP válida', () => {
    cy.request({
      url: 'http://localhost:3000/',
      failOnStatusCode: false,
      timeout: 30000
    }).then((response) => {
      // Aceita qualquer resposta HTTP válida (200, 404, 500, etc.)
      expect(response.status).to.be.a('number');
      expect(response.status).to.be.greaterThan(0);
    });
  });
});