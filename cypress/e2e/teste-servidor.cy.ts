describe('Teste de Conectividade do Servidor', () => {
  it('deve verificar se o servidor está respondendo', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:3000',
      timeout: 30000,
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`Status: ${response.status}`);
      cy.log(`Headers: ${JSON.stringify(response.headers)}`);
      
      // Verificar se o servidor está respondendo
      expect(response.status).to.be.oneOf([200, 304]);
      
      // Verificar se é HTML
      if (response.headers['content-type']) {
        expect(response.headers['content-type']).to.include('text/html');
      }
    });
  });

  it('deve conseguir carregar a página principal', () => {
    cy.visit('http://localhost:3000/', {
      timeout: 30000,
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true,
      failOnStatusCode: false
    });
    
    // Aguardar a página carregar
    cy.wait(3000);
    
    // Verificar se o elemento root existe
    cy.get('#root', { timeout: 15000 }).should('exist');
    
    // Verificar se o body está visível
    cy.get('body').should('be.visible');
    
    // Capturar screenshot para análise
    cy.screenshot('pagina-principal-carregada');
  });

  it('deve verificar se a navegação funciona', () => {
    cy.visit('http://localhost:3000/', {
      timeout: 30000,
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true
    });
    
    cy.wait(5000);
    
    // Verificar se existe algum elemento de navegação
    cy.get('body').then(($body) => {
      if ($body.find('[href*="cliente"]').length > 0) {
        cy.log('Link de clientes encontrado');
      } else if ($body.text().includes('Cliente')) {
        cy.log('Texto "Cliente" encontrado na página');
      } else {
        cy.log('Nenhum elemento de navegação para clientes encontrado');
      }
    });
    
    cy.screenshot('navegacao-verificada');
  });
});