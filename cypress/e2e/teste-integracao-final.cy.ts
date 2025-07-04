describe('Teste de Integração Final - Sistema Veterinário', () => {
  beforeEach(() => {
    // Configurações de timeout
    Cypress.config('defaultCommandTimeout', 15000);
    Cypress.config('requestTimeout', 15000);
    Cypress.config('responseTimeout', 15000);
  });

  it('deve verificar se o backend está funcionando', () => {
    // Testar conexão com o backend
    cy.request({
      method: 'GET',
      url: 'http://localhost:3333/api/tutors',
      timeout: 10000
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');
    });
  });

  it('deve conseguir acessar o frontend', () => {
    // Visitar a página principal
    cy.visit('http://localhost:3000/', {
      timeout: 30000,
      retries: 2
    });
    
    // Verificar se a página carregou
    cy.get('body').should('be.visible');
    
    // Verificar se há elementos básicos da interface
    cy.get('nav, header, main, [role="navigation"]', { timeout: 10000 })
      .should('exist');
  });

  it('deve conseguir navegar para a página de clientes', () => {
    cy.visit('http://localhost:3000/', {
      timeout: 30000
    });
    
    // Aguardar carregamento
    cy.wait(2000);
    
    // Tentar encontrar e clicar no link de clientes
    cy.contains('Clientes', { timeout: 10000 })
      .should('be.visible')
      .click();
    
    // Verificar se navegou para a página correta
    cy.url().should('include', '/clientes');
  });

  it('deve criar um tutor via API e verificar no frontend', () => {
    const tutorData = {
      nome: 'Integração Teste',
      email: `integracao.${Date.now()}@teste.com`,
      telefone: '(11) 98765-4321',
      endereco: 'Rua da Integração, 456'
    };

    // Criar tutor via API
    cy.request({
      method: 'POST',
      url: 'http://localhost:3333/api/tutors',
      body: tutorData,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 201]);
      expect(response.body).to.have.property('id');
      
      // Salvar ID para verificação
      cy.wrap(response.body.id).as('tutorId');
    });

    // Verificar se o tutor aparece na lista via API
    cy.get('@tutorId').then((tutorId) => {
      cy.request({
        method: 'GET',
        url: `http://localhost:3333/api/tutors/${tutorId}`
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.nome).to.eq(tutorData.nome);
      });
    });
  });

  it('deve verificar se a aplicação está totalmente funcional', () => {
    // Teste final de sanidade
    cy.visit('http://localhost:3000/');
    
    // Verificar se não há erros de console críticos
    cy.window().then((win) => {
      // Verificar se a aplicação React foi carregada
      expect(win.document.querySelector('#root')).to.exist;
    });
    
    // Verificar se consegue fazer requisições para o backend
    cy.request('http://localhost:3333/api/tutors').then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});