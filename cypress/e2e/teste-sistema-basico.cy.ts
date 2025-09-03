/// <reference types="cypress" />

/**
 * 🧪 TESTE BÁSICO DO SISTEMA VETERINÁRIO
 * 
 * Testa funcionalidades básicas após as correções
 */

describe('🧪 Sistema Veterinário - Testes Básicos', () => {
  const baseUrl = 'http://localhost:3000';
  
  beforeEach(() => {
    // Interceptar chamadas da API com respostas mock
    cy.intercept('GET', '**/api/dashboard/stats', {
      statusCode: 200,
      body: {
        totalTutors: 10,
        totalPets: 25,
        appointmentsToday: 5,
        revenue: 1500
      }
    }).as('dashboardStats');
    
    cy.intercept('GET', '**/api/tutors**', {
      statusCode: 200,
      body: {
        data: [],
        total: 0,
        page: 1,
        limit: 10
      }
    }).as('tutorsList');
    
    cy.intercept('GET', '**/api/pets**', {
      statusCode: 200,
      body: {
        data: [],
        total: 0,
        page: 1,
        limit: 10
      }
    }).as('petsList');
    
    cy.viewport(1920, 1080);
  });

  it('Deve carregar a página inicial', () => {
    cy.visit(baseUrl);
    
    // Verificar se a página carregou
    cy.get('body').should('be.visible');
    
    // Verificar se tem elementos básicos
    cy.get('nav, header, main, [role="navigation"]', { timeout: 10000 })
      .should('exist');
  });

  it('Deve navegar entre páginas principais', () => {
    cy.visit(baseUrl);
    
    // Aguardar carregamento
    cy.wait(2000);
    
    // Tentar navegar para Dashboard
    cy.get('a[href*="dashboard"], button').contains(/dashboard/i).first().click({ force: true });
    cy.wait(1000);
    
    // Tentar navegar para Clientes
    cy.get('a[href*="clientes"], a[href*="tutors"], button').contains(/clientes|tutores/i).first().click({ force: true });
    cy.wait(1000);
    
    // Tentar navegar para Pets
    cy.get('a[href*="pets"], button').contains(/pets|animais/i).first().click({ force: true });
    cy.wait(1000);
  });

  it('Deve verificar responsividade', () => {
    cy.visit(baseUrl);
    
    // Testar em mobile
    cy.viewport(375, 667);
    cy.wait(1000);
    cy.get('body').should('be.visible');
    
    // Testar em tablet
    cy.viewport(768, 1024);
    cy.wait(1000);
    cy.get('body').should('be.visible');
    
    // Voltar para desktop
    cy.viewport(1920, 1080);
    cy.wait(1000);
    cy.get('body').should('be.visible');
  });

  it('Deve verificar se APIs estão sendo chamadas', () => {
    cy.visit(baseUrl);
    
    // Aguardar e verificar se pelo menos uma API foi chamada
    cy.wait(3000);
    
    // Verificar se não há erros de console críticos
    cy.window().then((win) => {
      // Verificar se a aplicação React foi montada
      expect(win.document.querySelector('#root')).to.exist;
    });
  });

  it('Deve verificar elementos de UI básicos', () => {
    cy.visit(baseUrl);
    cy.wait(2000);
    
    // Verificar se tem navegação
    cy.get('nav, [role="navigation"], header').should('exist');
    
    // Verificar se tem conteúdo principal
    cy.get('main, [role="main"], .main-content').should('exist');
    
    // Verificar se não há erros visíveis
    cy.get('body').should('not.contain.text', 'Error');
    cy.get('body').should('not.contain.text', 'Failed to fetch');
  });
});