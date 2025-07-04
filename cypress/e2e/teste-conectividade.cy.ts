describe('Teste de Conectividade', () => {
  it('deve carregar a página inicial', () => {
    cy.visit('http://localhost:3000/', {
      timeout: 30000,
      retries: 3
    })
    
    // Verifica se a página carregou
    cy.get('body').should('be.visible')
    
    // Aguarda um pouco para garantir que tudo carregou
    cy.wait(2000)
    
    // Verifica se existe algum conteúdo na página
    cy.get('body').should('not.be.empty')
    
    // Tenta encontrar qualquer link ou botão
    cy.get('a, button').should('have.length.greaterThan', 0)
  })
  
  it('deve navegar para a página de clientes', () => {
    cy.visit('http://localhost:3000/', {
      timeout: 30000
    })
    
    // Procura por qualquer link que contenha "Cliente" ou "Tutor"
    cy.contains('Cliente', { timeout: 10000 }).should('be.visible')
    cy.contains('Cliente').click()
    
    // Aguarda a navegação
    cy.wait(2000)
    
    // Verifica se chegou na página correta
    cy.url().should('include', 'cliente')
  })
})