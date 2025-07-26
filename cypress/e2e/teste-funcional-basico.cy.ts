/// <reference types="cypress" />

/**
 * 🧪 TESTE FUNCIONAL BÁSICO - PulseVet System V1.0
 * 
 * Testes essenciais para verificar se o sistema está funcionando corretamente
 */

describe('🚀 PulseVet - Testes Funcionais Básicos', () => {
  const baseUrl = 'http://localhost:3000';
  
  describe('🔐 Autenticação', () => {
    it('Deve carregar a página de login', () => {
      cy.visit(baseUrl);
      cy.url().should('include', '/login');
      
      // Verificar elementos básicos da tela de login
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button').contains('Entrar').should('be.visible');
    });

    it('Deve fazer login com credenciais válidas', () => {
      cy.visit(`${baseUrl}/login`);
      
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('***REMOVIDO***');
      cy.get('button').contains('Entrar').click();
      
      // Aguardar redirecionamento
      cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
      
      // Verificar se chegou no dashboard
      cy.contains('Dashboard', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('🧭 Navegação', () => {
    beforeEach(() => {
      // Login antes de cada teste
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('***REMOVIDO***');
      cy.get('button').contains('Entrar').click();
      cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
    });

    it('Deve navegar para Agendamentos', () => {
      cy.contains('Agendamentos').click();
      cy.url().should('include', '/agendamentos');
      cy.contains('Agendamentos').should('be.visible');
    });

    it('Deve navegar para Tutores', () => {
      cy.contains('Tutores').click();
      cy.url().should('include', '/tutores');
      cy.contains('Tutores').should('be.visible');
    });

    it('Deve navegar para Pets', () => {
      cy.contains('Pets').click();
      cy.url().should('include', '/pets');
      cy.contains('Pets').should('be.visible');
    });

    it('Deve navegar para Prontuários', () => {
      cy.contains('Prontuários').click();
      cy.url().should('include', '/prontuarios');
      cy.contains('Prontuários').should('be.visible');
    });

    it('Deve navegar para Estoque', () => {
      cy.contains('Estoque').click();
      cy.url().should('include', '/estoque');
      cy.contains('Estoque').should('be.visible');
    });

    it('Deve navegar para Financeiro', () => {
      cy.contains('Financeiro').click();
      cy.url().should('include', '/financeiro');
      cy.contains('Financeiro').should('be.visible');
    });
  });

  describe('📊 Dashboard', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('***REMOVIDO***');
      cy.get('button').contains('Entrar').click();
      cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
    });

    it('Deve exibir cards de métricas', () => {
      // Verificar se existem cards com números/estatísticas
      cy.get('.card-vet, .bg-card, [class*="card"]').should('have.length.greaterThan', 0);
    });

    it('Deve carregar sem erros de console críticos', () => {
      cy.window().then((win) => {
        cy.spy(win.console, 'error').as('consoleError');
      });
      
      cy.reload();
      
      // Aguardar carregamento
      cy.wait(3000);
      
      // Verificar se não há erros críticos
      cy.get('@consoleError').should('not.have.been.called');
    });
  });

  describe('👥 Gestão de Tutores', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('***REMOVIDO***');
      cy.get('button').contains('Entrar').click();
      cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
      cy.contains('Tutores').click();
    });

    it('Deve carregar a página de tutores', () => {
      cy.url().should('include', '/tutores');
      cy.contains('Tutores').should('be.visible');
    });

    it('Deve ter botão para adicionar novo tutor', () => {
      cy.get('button').contains(/novo|adicionar|\+/i).should('be.visible');
    });
  });

  describe('🐕 Gestão de Pets', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('***REMOVIDO***');
      cy.get('button').contains('Entrar').click();
      cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
      cy.contains('Pets').click();
    });

    it('Deve carregar a página de pets', () => {
      cy.url().should('include', '/pets');
      cy.contains('Pets').should('be.visible');
    });
  });

  describe('📅 Agendamentos', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('***REMOVIDO***');
      cy.get('button').contains('Entrar').click();
      cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
      cy.contains('Agendamentos').click();
    });

    it('Deve carregar a página de agendamentos', () => {
      cy.url().should('include', '/agendamentos');
      cy.contains('Agendamentos').should('be.visible');
    });
  });

  describe('📦 Estoque', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('***REMOVIDO***');
      cy.get('button').contains('Entrar').click();
      cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
      cy.contains('Estoque').click();
    });

    it('Deve carregar a página de estoque', () => {
      cy.url().should('include', '/estoque');
      cy.contains('Estoque').should('be.visible');
    });
  });

  describe('📱 Responsividade', () => {
    it('Deve funcionar em mobile', () => {
      cy.viewport(375, 667);
      cy.visit(`${baseUrl}/login`);
      
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('***REMOVIDO***');
      cy.get('button').contains('Entrar').click();
      
      cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
    });

    it('Deve funcionar em tablet', () => {
      cy.viewport(768, 1024);
      cy.visit(`${baseUrl}/login`);
      
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('***REMOVIDO***');
      cy.get('button').contains('Entrar').click();
      
      cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
    });
  });

  describe('⚡ Performance', () => {
    it('Deve carregar rapidamente', () => {
      const start = Date.now();
      
      cy.visit(baseUrl);
      cy.get('input[type="email"]').should('be.visible').then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(5000); // Menos de 5 segundos
      });
    });
  });

  describe('🔗 Conectividade API', () => {
    it('Backend deve estar respondendo', () => {
      cy.request({
        url: 'http://localhost:3333/api/dashboard/stats',
        failOnStatusCode: false
      }).then((response) => {
        // Deve retornar 200 (sucesso) ou 401 (não autenticado)
        expect(response.status).to.be.oneOf([200, 401]);
      });
    });
  });
});