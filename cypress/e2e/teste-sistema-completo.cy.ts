/// <reference types="cypress" />

/**
 * 🧪 TESTE SISTEMA COMPLETO - PulseVet System V1.0
 * 
 * Este teste verifica TODOS os módulos e funcionalidades do sistema
 * de forma automatizada e detalhada.
 */

describe('🚀 PulseVet System - Teste Completo', () => {
  const baseUrl = 'http://localhost:3000';
  const apiUrl = 'http://localhost:3333/api';
  
  // Dados de teste
  const testData = {
    tutor: {
      name: 'João Silva Teste',
      email: 'joao.teste@email.com',
      phone: '11999999999',
      cpf: '12345678901',
      address: 'Rua Teste, 123'
    },
    pet: {
      name: 'Rex Teste',
      species: 'Cão',
      breed: 'Labrador',
      age: 3,
      weight: 25.5
    },
    product: {
      name: 'Ração Premium Teste',
      category: 'Alimentação',
      price: 89.90,
      stock: 50
    }
  };

  beforeEach(() => {
    // Interceptar chamadas da API para monitoramento
    cy.intercept('GET', `${apiUrl}/**`).as('apiGet');
    cy.intercept('POST', `${apiUrl}/**`).as('apiPost');
    cy.intercept('PUT', `${apiUrl}/**`).as('apiPut');
    cy.intercept('DELETE', `${apiUrl}/**`).as('apiDelete');
  });

  describe('🔐 1. TESTES DE AUTENTICAÇÃO', () => {
    it('Deve carregar a página de login', () => {
      cy.visit(baseUrl);
      cy.url().should('include', '/login');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('Deve fazer login com sucesso', () => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      
      // Verificar redirecionamento para dashboard
      cy.url().should('include', '/');
      cy.get('[data-testid="dashboard"]', { timeout: 10000 }).should('be.visible');
    });

    it('Deve rejeitar credenciais inválidas', () => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('invalid@email.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      // Verificar mensagem de erro
      cy.contains('Credenciais inválidas').should('be.visible');
    });
  });

  describe('📊 2. TESTES DO DASHBOARD', () => {
    beforeEach(() => {
      // Login antes de cada teste
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/');
    });

    it('Deve exibir métricas principais', () => {
      cy.get('[data-testid="total-agendamentos"]').should('be.visible');
      cy.get('[data-testid="pets-cadastrados"]').should('be.visible');
      cy.get('[data-testid="receita-mensal"]').should('be.visible');
      cy.get('[data-testid="total-tutores"]').should('be.visible');
    });

    it('Deve carregar agendamentos próximos', () => {
      cy.get('[data-testid="proximos-agendamentos"]').should('be.visible');
      cy.wait('@apiGet');
    });

    it('Deve exibir atividades recentes', () => {
      cy.get('[data-testid="atividades-recentes"]').should('be.visible');
    });
  });

  describe('🧭 3. TESTES DE NAVEGAÇÃO', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
    });

    it('Deve navegar para todos os módulos', () => {
      const modules = [
        { name: 'Dashboard', path: '/', testId: 'dashboard' },
        { name: 'Agendamentos', path: '/agendamentos', testId: 'agendamentos' },
        { name: 'Tutores', path: '/tutores', testId: 'tutores' },
        { name: 'Pets', path: '/pets', testId: 'pets' },
        { name: 'Prontuários', path: '/prontuarios', testId: 'prontuarios' },
        { name: 'Estoque', path: '/estoque', testId: 'estoque' },
        { name: 'Financeiro', path: '/financeiro', testId: 'financeiro' }
      ];

      modules.forEach(module => {
        cy.get(`[href="${module.path}"]`).click();
        cy.url().should('include', module.path);
        cy.get(`[data-testid="${module.testId}"]`, { timeout: 5000 }).should('be.visible');
      });
    });

    it('Deve destacar o item ativo no menu', () => {
      cy.get('[href="/tutores"]').click();
      cy.get('[href="/tutores"]').should('have.class', 'bg-sidebar-accent');
    });
  });

  describe('👥 4. TESTES DE GESTÃO DE TUTORES', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.get('[href="/tutores"]').click();
    });

    it('Deve listar tutores existentes', () => {
      cy.get('[data-testid="tutores-lista"]').should('be.visible');
      cy.wait('@apiGet');
    });

    it('Deve abrir modal de cadastro de tutor', () => {
      cy.get('[data-testid="btn-novo-tutor"]').click();
      cy.get('[data-testid="modal-tutor"]').should('be.visible');
    });

    it('Deve cadastrar novo tutor', () => {
      cy.get('[data-testid="btn-novo-tutor"]').click();
      
      // Preencher formulário
      cy.get('input[name="name"]').type(testData.tutor.name);
      cy.get('input[name="email"]').type(testData.tutor.email);
      cy.get('input[name="phone"]').type(testData.tutor.phone);
      cy.get('input[name="cpf"]').type(testData.tutor.cpf);
      cy.get('input[name="address"]').type(testData.tutor.address);
      
      cy.get('button[type="submit"]').click();
      cy.wait('@apiPost');
      
      // Verificar sucesso
      cy.contains('Tutor cadastrado com sucesso').should('be.visible');
    });

    it('Deve validar campos obrigatórios', () => {
      cy.get('[data-testid="btn-novo-tutor"]').click();
      cy.get('button[type="submit"]').click();
      
      cy.contains('Nome é obrigatório').should('be.visible');
      cy.contains('Email é obrigatório').should('be.visible');
    });
  });

  describe('🐕 5. TESTES DE GESTÃO DE PETS', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.get('[href="/pets"]').click();
    });

    it('Deve listar pets existentes', () => {
      cy.get('[data-testid="pets-lista"]').should('be.visible');
      cy.wait('@apiGet');
    });

    it('Deve abrir modal de cadastro de pet', () => {
      cy.get('[data-testid="btn-novo-pet"]').click();
      cy.get('[data-testid="modal-pet"]').should('be.visible');
    });
  });

  describe('📅 6. TESTES DE AGENDAMENTOS', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.get('[href="/agendamentos"]').click();
    });

    it('Deve exibir calendário de agendamentos', () => {
      cy.get('[data-testid="calendario"]').should('be.visible');
      cy.wait('@apiGet');
    });

    it('Deve abrir modal de novo agendamento', () => {
      cy.get('[data-testid="btn-novo-agendamento"]').click();
      cy.get('[data-testid="modal-agendamento"]').should('be.visible');
    });
  });

  describe('📦 7. TESTES DE ESTOQUE', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.get('[href="/estoque"]').click();
    });

    it('Deve listar produtos em estoque', () => {
      cy.get('[data-testid="produtos-lista"]').should('be.visible');
      cy.wait('@apiGet');
    });

    it('Deve cadastrar novo produto', () => {
      cy.get('[data-testid="btn-novo-produto"]').click();
      
      cy.get('input[name="name"]').type(testData.product.name);
      cy.get('select[name="category"]').select(testData.product.category);
      cy.get('input[name="price"]').type(testData.product.price.toString());
      cy.get('input[name="stock"]').type(testData.product.stock.toString());
      
      cy.get('button[type="submit"]').click();
      cy.wait('@apiPost');
    });
  });

  describe('🩺 8. TESTES DE PRONTUÁRIOS', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.get('[href="/prontuarios"]').click();
    });

    it('Deve listar prontuários existentes', () => {
      cy.get('[data-testid="prontuarios-lista"]').should('be.visible');
      cy.wait('@apiGet');
    });
  });

  describe('💰 9. TESTES FINANCEIROS', () => {
    beforeEach(() => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.get('[href="/financeiro"]').click();
    });

    it('Deve exibir relatórios financeiros', () => {
      cy.get('[data-testid="relatorios-financeiros"]').should('be.visible');
      cy.wait('@apiGet');
    });
  });

  describe('📱 10. TESTES DE RESPONSIVIDADE', () => {
    const viewports = [
      { device: 'Desktop', width: 1920, height: 1080 },
      { device: 'Laptop', width: 1366, height: 768 },
      { device: 'Tablet', width: 768, height: 1024 },
      { device: 'Mobile', width: 375, height: 667 }
    ];

    viewports.forEach(viewport => {
      it(`Deve funcionar em ${viewport.device} (${viewport.width}x${viewport.height})`, () => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit(`${baseUrl}/login`);
        
        cy.get('input[type="email"]').type('admin@pulsevetystem.com');
        cy.get('input[type="password"]').type('admin123');
        cy.get('button[type="submit"]').click();
        
        // Verificar se o layout se adapta
        cy.get('[data-testid="dashboard"]').should('be.visible');
        
        if (viewport.width < 768) {
          // Mobile: menu deve estar colapsado
          cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible');
        } else {
          // Desktop/Tablet: menu lateral deve estar visível
          cy.get('[data-testid="sidebar"]').should('be.visible');
        }
      });
    });
  });

  describe('⚡ 11. TESTES DE PERFORMANCE', () => {
    it('Deve carregar a página inicial rapidamente', () => {
      const start = Date.now();
      cy.visit(baseUrl);
      cy.get('input[type="email"]').should('be.visible').then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(3000); // Menos de 3 segundos
      });
    });

    it('Deve navegar entre páginas rapidamente', () => {
      cy.visit(`${baseUrl}/login`);
      cy.get('input[type="email"]').type('admin@pulsevetystem.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      
      const start = Date.now();
      cy.get('[href="/tutores"]').click();
      cy.get('[data-testid="tutores"]').should('be.visible').then(() => {
        const navTime = Date.now() - start;
        expect(navTime).to.be.lessThan(1000); // Menos de 1 segundo
      });
    });
  });

  describe('🔗 12. TESTES DE INTEGRAÇÃO API', () => {
    it('Deve comunicar com todos os endpoints principais', () => {
      const endpoints = [
        '/api/tutors',
        '/api/pets', 
        '/api/appointments',
        '/api/records',
        '/api/products',
        '/api/dashboard/stats'
      ];

      endpoints.forEach(endpoint => {
        cy.request({
          url: `http://localhost:3333${endpoint}`,
          failOnStatusCode: false
        }).then(response => {
          expect(response.status).to.be.oneOf([200, 401]); // 200 ou 401 (não autenticado)
        });
      });
    });
  });

  after(() => {
    // Gerar relatório de testes
    cy.log('🎉 TESTES CONCLUÍDOS!');
    cy.log('📊 Verificar relatório detalhado no Cypress Dashboard');
  });
});