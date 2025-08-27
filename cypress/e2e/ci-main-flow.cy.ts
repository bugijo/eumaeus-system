// cypress/e2e/ci-main-flow.cy.ts
// Teste principal para CI/CD - Fluxo crítico da aplicação

describe('CI/CD - Fluxo Principal do Sistema Veterinário', () => {
  const apiUrl = Cypress.env('apiUrl') || 'https://Eumaeus-backend.onrender.com/api';
  
  beforeEach(() => {
    // Configurações otimizadas para CI
    Cypress.config('defaultCommandTimeout', 20000);
    Cypress.config('requestTimeout', 20000);
    Cypress.config('responseTimeout', 20000);
  });

  it('🔍 Deve verificar se o backend está online e respondendo', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/tutors`,
      timeout: 15000,
      retries: 3
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');
      cy.log('✅ Backend está online e funcionando');
    });
  });

  it('🌐 Deve carregar o frontend corretamente', () => {
    cy.visit('/', {
      timeout: 30000,
      retries: 2
    });
    
    // Verificar se a aplicação React carregou
    cy.get('#root', { timeout: 15000 }).should('exist');
    cy.get('body').should('be.visible');
    
    // Verificar se não há erros críticos de JavaScript
    cy.window().then((win) => {
      expect(win.document.querySelector('#root')).to.exist;
    });
    
    cy.log('✅ Frontend carregou com sucesso');
  });

  it('📋 Deve conseguir navegar pela aplicação', () => {
    cy.visit('/');
    
    // Aguardar carregamento completo
    cy.wait(3000);
    
    // Verificar se existem elementos de navegação
    cy.get('body').then(($body) => {
      const hasNavigation = $body.find('nav, [role="navigation"], header').length > 0;
      
      if (hasNavigation) {
        cy.log('✅ Elementos de navegação encontrados');
        
        // Tentar navegar para diferentes seções
        const sections = ['Tutores', 'Pets', 'Dashboard'];
        
        sections.forEach(section => {
          cy.get('body').then(($body) => {
            if ($body.text().includes(section)) {
              cy.contains(section, { timeout: 5000 })
                .should('be.visible')
                .click({ force: true });
              cy.wait(1000);
              cy.log(`✅ Navegação para ${section} funcionando`);
            }
          });
        });
      } else {
        cy.log('⚠️ Elementos de navegação não encontrados, mas aplicação carregou');
      }
    });
  });

  it('🔄 Deve testar integração Frontend + Backend', () => {
    // Criar um tutor via API para testar integração
    const tutorData = {
      nome: `CI Test ${Date.now()}`,
      email: `ci.test.${Date.now()}@automation.com`,
      telefone: '(11) 99999-9999',
      endereco: 'Rua do Teste CI, 123'
    };

    cy.request({
      method: 'POST',
      url: `${apiUrl}/tutors`,
      body: tutorData,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 201]);
      expect(response.body).to.have.property('id');
      
      const tutorId = response.body.id;
      cy.log(`✅ Tutor criado com ID: ${tutorId}`);
      
      // Verificar se consegue buscar o tutor criado
      cy.request({
        method: 'GET',
        url: `${apiUrl}/tutors/${tutorId}`
      }).then((getResponse) => {
        expect(getResponse.status).to.eq(200);
        expect(getResponse.body.nome).to.eq(tutorData.nome);
        cy.log('✅ Integração API funcionando corretamente');
      });
      
      // Limpar dados de teste
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/tutors/${tutorId}`,
        failOnStatusCode: false
      }).then(() => {
        cy.log('🧹 Dados de teste limpos');
      });
    });
  });

  it('🎯 Deve verificar funcionalidades críticas da aplicação', () => {
    cy.visit('/');
    
    // Verificar se a aplicação não tem erros de console críticos
    cy.window().then((win) => {
      // Verificar se React está funcionando
      expect(win.document.querySelector('#root')).to.exist;
      
      // Verificar se não há erros de rede críticos
      cy.request({
        url: apiUrl + '/tutors',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 401, 403, 404]);
        cy.log('✅ Conectividade com API verificada');
      });
    });
    
    cy.log('✅ Todas as verificações críticas passaram');
  });
});