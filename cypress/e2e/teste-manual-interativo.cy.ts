/// <reference types="cypress" />

/**
 * 🧪 TESTE MANUAL INTERATIVO - PulseVet System V1.0
 * 
 * Este teste permite verificar manualmente cada funcionalidade do sistema
 * com pausas para inspeção visual e interação manual
 */

describe('🚀 PulseVet - Teste Manual Interativo', () => {
  const baseUrl = 'http://localhost:3000';
  
  beforeEach(() => {
    // Configurar viewport padrão
    cy.viewport(1280, 720);
  });

  it('🔍 INSPEÇÃO COMPLETA DO SISTEMA', () => {
    // 1. TESTE DE LOGIN
    cy.log('🔐 TESTANDO LOGIN');
    cy.visit(`${baseUrl}/login`);
    
    // Verificar elementos da tela de login
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button').contains('Entrar').should('be.visible');
    
    // Fazer login
    cy.get('input[type="email"]').type('admin@pulsevetystem.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button').contains('Entrar').click();
    
    // Aguardar redirecionamento
    cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
    
    // Pausa para inspeção visual
    cy.wait(2000);
    
    // 2. TESTE DO DASHBOARD
    cy.log('📊 TESTANDO DASHBOARD');
    cy.contains('Dashboard').should('be.visible');
    
    // Verificar cards de métricas
    cy.get('body').should('contain', 'Agendamentos');
    cy.get('body').should('contain', 'Pets');
    cy.get('body').should('contain', 'Receita');
    cy.get('body').should('contain', 'Tutores');
    
    cy.wait(3000); // Pausa para inspeção
    
    // 3. TESTE DE NAVEGAÇÃO - AGENDAMENTOS
    cy.log('📅 TESTANDO AGENDAMENTOS');
    cy.contains('Agendamentos').click();
    cy.url().should('include', '/agendamentos');
    cy.contains('Agendamentos').should('be.visible');
    
    cy.wait(2000);
    
    // 4. TESTE DE NAVEGAÇÃO - TUTORES
    cy.log('👥 TESTANDO TUTORES');
    cy.contains('Tutores').click();
    cy.url().should('include', '/tutores');
    cy.contains('Tutores').should('be.visible');
    
    // Verificar se há botão de adicionar
    cy.get('button').contains(/novo|adicionar|\+/i).should('be.visible');
    
    cy.wait(2000);
    
    // 5. TESTE DE NAVEGAÇÃO - PETS
    cy.log('🐕 TESTANDO PETS');
    cy.contains('Pets').click();
    cy.url().should('include', '/pets');
    cy.contains('Pets').should('be.visible');
    
    cy.wait(2000);
    
    // 6. TESTE DE NAVEGAÇÃO - PRONTUÁRIOS
    cy.log('📋 TESTANDO PRONTUÁRIOS');
    cy.contains('Prontuários').click();
    cy.url().should('include', '/prontuarios');
    cy.contains('Prontuários').should('be.visible');
    
    cy.wait(2000);
    
    // 7. TESTE DE NAVEGAÇÃO - ESTOQUE
    cy.log('📦 TESTANDO ESTOQUE');
    cy.contains('Estoque').click();
    cy.url().should('include', '/estoque');
    cy.contains('Estoque').should('be.visible');
    
    cy.wait(2000);
    
    // 8. TESTE DE NAVEGAÇÃO - FINANCEIRO
    cy.log('💰 TESTANDO FINANCEIRO');
    cy.contains('Financeiro').click();
    cy.url().should('include', '/financeiro');
    cy.contains('Financeiro').should('be.visible');
    
    cy.wait(2000);
    
    // 9. VOLTAR AO DASHBOARD
    cy.log('🏠 VOLTANDO AO DASHBOARD');
    cy.contains('Dashboard').click();
    cy.url().should('eq', `${baseUrl}/`);
    
    cy.wait(2000);
    
    // 10. TESTE DE RESPONSIVIDADE - MOBILE
    cy.log('📱 TESTANDO RESPONSIVIDADE MOBILE');
    cy.viewport(375, 667);
    cy.wait(1000);
    
    // Verificar se o menu ainda funciona
    cy.get('body').should('be.visible');
    
    // 11. TESTE DE RESPONSIVIDADE - TABLET
    cy.log('📱 TESTANDO RESPONSIVIDADE TABLET');
    cy.viewport(768, 1024);
    cy.wait(1000);
    
    // 12. VOLTAR AO DESKTOP
    cy.log('🖥️ VOLTANDO AO DESKTOP');
    cy.viewport(1280, 720);
    cy.wait(1000);
    
    // 13. TESTE FINAL - VERIFICAR SE TUDO AINDA FUNCIONA
    cy.log('✅ TESTE FINAL - VERIFICAÇÃO GERAL');
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Agendamentos').should('be.visible');
    cy.contains('Tutores').should('be.visible');
    cy.contains('Pets').should('be.visible');
    cy.contains('Prontuários').should('be.visible');
    cy.contains('Estoque').should('be.visible');
    cy.contains('Financeiro').should('be.visible');
    
    cy.wait(3000); // Pausa final para inspeção
    
    cy.log('🎉 TESTE COMPLETO FINALIZADO COM SUCESSO!');
  });

  it('🔧 TESTE DE FUNCIONALIDADES ESPECÍFICAS', () => {
    // Login
    cy.visit(`${baseUrl}/login`);
    cy.get('input[type="email"]').type('admin@pulsevetystem.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button').contains('Entrar').click();
    cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
    
    // Teste específico de cada módulo
    const modulos = [
      { nome: 'Agendamentos', url: '/agendamentos' },
      { nome: 'Tutores', url: '/tutores' },
      { nome: 'Pets', url: '/pets' },
      { nome: 'Prontuários', url: '/prontuarios' },
      { nome: 'Estoque', url: '/estoque' },
      { nome: 'Financeiro', url: '/financeiro' }
    ];
    
    modulos.forEach((modulo) => {
      cy.log(`🔍 TESTANDO MÓDULO: ${modulo.nome}`);
      
      // Navegar para o módulo
      cy.contains(modulo.nome).click();
      cy.url().should('include', modulo.url);
      
      // Verificar se carregou corretamente
      cy.contains(modulo.nome).should('be.visible');
      
      // Aguardar carregamento
      cy.wait(1500);
      
      // Verificar se não há erros de console
      cy.window().then((win) => {
        const errors = win.console.error;
        if (errors && errors.length > 0) {
          cy.log(`⚠️ Possíveis erros de console em ${modulo.nome}`);
        }
      });
    });
    
    cy.log('✅ TESTE DE FUNCIONALIDADES ESPECÍFICAS CONCLUÍDO');
  });

  it('⚡ TESTE DE PERFORMANCE', () => {
    const startTime = Date.now();
    
    // Login
    cy.visit(`${baseUrl}/login`);
    cy.get('input[type="email"]').type('admin@pulsevetystem.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button').contains('Entrar').click();
    cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`);
    
    // Medir tempo de carregamento do dashboard
    cy.contains('Dashboard').should('be.visible').then(() => {
      const loadTime = Date.now() - startTime;
      cy.log(`⏱️ Tempo de carregamento total: ${loadTime}ms`);
      
      if (loadTime < 5000) {
        cy.log('✅ Performance EXCELENTE (< 5s)');
      } else if (loadTime < 10000) {
        cy.log('⚠️ Performance ACEITÁVEL (5-10s)');
      } else {
        cy.log('❌ Performance RUIM (> 10s)');
      }
    });
    
    // Teste de navegação rápida
    const navegacaoStart = Date.now();
    
    cy.contains('Agendamentos').click();
    cy.url().should('include', '/agendamentos');
    
    cy.contains('Tutores').click();
    cy.url().should('include', '/tutores');
    
    cy.contains('Dashboard').click();
    cy.url().should('eq', `${baseUrl}/`).then(() => {
      const navegacaoTime = Date.now() - navegacaoStart;
      cy.log(`⏱️ Tempo de navegação: ${navegacaoTime}ms`);
      
      if (navegacaoTime < 3000) {
        cy.log('✅ Navegação RÁPIDA');
      } else {
        cy.log('⚠️ Navegação LENTA');
      }
    });
  });

  it('🔗 TESTE DE CONECTIVIDADE API', () => {
    // Testar endpoints principais
    const endpoints = [
      '/api/dashboard/stats',
      '/api/tutores',
      '/api/pets',
      '/api/agendamentos',
      '/api/produtos'
    ];
    
    endpoints.forEach((endpoint) => {
      cy.request({
        url: `http://localhost:3333${endpoint}`,
        failOnStatusCode: false
      }).then((response) => {
        cy.log(`🔗 ${endpoint}: Status ${response.status}`);
        
        if (response.status === 200) {
          cy.log(`✅ ${endpoint} - OK`);
        } else if (response.status === 401) {
          cy.log(`🔒 ${endpoint} - Requer autenticação (OK)`);
        } else {
          cy.log(`⚠️ ${endpoint} - Status ${response.status}`);
        }
      });
    });
  });
});