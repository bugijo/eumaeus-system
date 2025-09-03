/// <reference types="cypress" />

/**
 * 🏥 TESTE COMPLETO DE CLÍNICA VETERINÁRIA
 * 
 * Este teste simula um dia completo de trabalho em uma clínica veterinária,
 * testando todos os fluxos principais do sistema Eumaeus.
 */

describe('🏥 Simulação Completa de Clínica Veterinária', () => {
  const baseUrl = 'http://localhost:3000';
  
  // Dados de teste realistas
  const dadosClinica = {
    veterinario: {
      email: 'dr.silva@clinica.com',
      senha: '123456'
    },
    tutores: [
      {
        nome: 'Maria Santos',
        email: 'maria.santos@email.com',
        telefone: '11987654321',
        cpf: '12345678901',
        endereco: 'Rua das Flores, 123 - São Paulo/SP'
      },
      {
        nome: 'João Oliveira',
        email: 'joao.oliveira@email.com',
        telefone: '11876543210',
        cpf: '98765432100',
        endereco: 'Av. Paulista, 456 - São Paulo/SP'
      }
    ],
    pets: [
      {
        nome: 'Bella',
        especie: 'Cão',
        raca: 'Golden Retriever',
        idade: 3,
        peso: 28.5
      },
      {
        nome: 'Mimi',
        especie: 'Gato',
        raca: 'Persa',
        idade: 2,
        peso: 4.2
      }
    ],
    produtos: [
      {
        nome: 'Ração Premium Cães Adultos',
        categoria: 'Alimentação',
        preco: 89.90,
        estoque: 25
      },
      {
        nome: 'Vacina V10',
        categoria: 'Medicamento',
        preco: 45.00,
        estoque: 15
      }
    ]
  };

  beforeEach(() => {
    // Interceptar chamadas da API
    cy.intercept('GET', '**/api/**').as('apiGet');
    cy.intercept('POST', '**/api/**').as('apiPost');
    cy.intercept('PUT', '**/api/**').as('apiPut');
    cy.intercept('DELETE', '**/api/**').as('apiDelete');
    
    // Configurar viewport para desktop
    cy.viewport(1920, 1080);
  });

  describe('🌅 Abertura da Clínica - Manhã', () => {
    it('Deve fazer login e acessar o dashboard', () => {
      cy.visit(baseUrl);
      
      // Verificar se está na página de login
      cy.url().should('include', '/login');
      
      // Fazer login
      cy.get('input[type="email"]', { timeout: 10000 })
        .should('be.visible')
        .type(dadosClinica.veterinario.email);
      
      cy.get('input[type="password"]')
        .should('be.visible')
        .type(dadosClinica.veterinario.senha);
      
      cy.get('button[type="submit"]')
        .should('be.visible')
        .click();
      
      // Verificar se chegou ao dashboard
      cy.url().should('include', '/dashboard');
      cy.get('h1, h2').should('contain.text', 'Dashboard');
      
      // Verificar elementos principais do dashboard
      cy.get('[data-testid="stats-cards"], .grid').should('be.visible');
      cy.get('[data-testid="appointments-today"], .card').should('be.visible');
    });

    it('Deve verificar estatísticas da clínica', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Verificar cards de estatísticas
      cy.get('.card, [data-testid="stat-card"]').should('have.length.at.least', 3);
      
      // Verificar se há dados de agendamentos
      cy.get('body').should('contain.text', 'Agendamentos');
      
      // Verificar se há informações financeiras
      cy.get('body').should('contain.text', 'R$');
    });
  });

  describe('👥 Gestão de Clientes', () => {
    it('Deve cadastrar novos tutores', () => {
      cy.visit(`${baseUrl}/tutores`);
      
      dadosClinica.tutores.forEach((tutor, index) => {
        // Clicar em novo tutor
        cy.get('button, a').contains(/novo|adicionar|cadastrar/i).click();
        
        // Preencher formulário
        cy.get('input[name="name"], input[name="nome"]')
          .clear()
          .type(tutor.nome);
        
        cy.get('input[name="email"]')
          .clear()
          .type(tutor.email);
        
        cy.get('input[name="phone"], input[name="telefone"]')
          .clear()
          .type(tutor.telefone);
        
        if (cy.get('input[name="cpf"]').should('exist')) {
          cy.get('input[name="cpf"]')
            .clear()
            .type(tutor.cpf);
        }
        
        if (cy.get('input[name="address"], textarea[name="endereco"]').should('exist')) {
          cy.get('input[name="address"], textarea[name="endereco"]')
            .clear()
            .type(tutor.endereco);
        }
        
        // Salvar
        cy.get('button[type="submit"], button').contains(/salvar|cadastrar/i).click();
        
        // Verificar sucesso
        cy.get('body').should('contain.text', tutor.nome);
        
        // Voltar para lista se não for o último
        if (index < dadosClinica.tutores.length - 1) {
          cy.get('a, button').contains(/voltar|lista/i).click();
        }
      });
    });

    it('Deve cadastrar pets para os tutores', () => {
      cy.visit(`${baseUrl}/pets`);
      
      dadosClinica.pets.forEach((pet, index) => {
        // Clicar em novo pet
        cy.get('button, a').contains(/novo|adicionar|cadastrar/i).click();
        
        // Preencher dados do pet
        cy.get('input[name="name"], input[name="nome"]')
          .clear()
          .type(pet.nome);
        
        cy.get('select[name="species"], input[name="especie"]')
          .first()
          .then($el => {
            if ($el.is('select')) {
              cy.wrap($el).select(pet.especie);
            } else {
              cy.wrap($el).clear().type(pet.especie);
            }
          });
        
        cy.get('input[name="breed"], input[name="raca"]')
          .clear()
          .type(pet.raca);
        
        // Selecionar tutor
        cy.get('select[name="tutorId"], select').first().select(1);
        
        // Salvar
        cy.get('button[type="submit"], button').contains(/salvar|cadastrar/i).click();
        
        // Verificar sucesso
        cy.get('body').should('contain.text', pet.nome);
        
        // Voltar para lista se não for o último
        if (index < dadosClinica.pets.length - 1) {
          cy.get('a, button').contains(/voltar|lista/i).click();
        }
      });
    });
  });

  describe('📅 Agendamentos do Dia', () => {
    it('Deve criar agendamentos para hoje', () => {
      cy.visit(`${baseUrl}/agendamentos`);
      
      // Criar 3 agendamentos para simular um dia movimentado
      const agendamentos = [
        { hora: '09:00', servico: 'Consulta de Rotina' },
        { hora: '10:30', servico: 'Vacinação' },
        { hora: '14:00', servico: 'Cirurgia' }
      ];
      
      agendamentos.forEach((agendamento, index) => {
        // Clicar em novo agendamento
        cy.get('button, a').contains(/novo|agendar/i).click();
        
        // Selecionar pet
        cy.get('select[name="petId"], select').first().select(1);
        
        // Definir data e hora
        const hoje = new Date().toISOString().split('T')[0];
        cy.get('input[type="date"], input[name="date"]')
          .clear()
          .type(hoje);
        
        cy.get('input[type="time"], input[name="time"]')
          .clear()
          .type(agendamento.hora);
        
        // Adicionar observações
        cy.get('textarea[name="notes"], textarea')
          .clear()
          .type(`${agendamento.servico} - Agendamento ${index + 1}`);
        
        // Salvar
        cy.get('button[type="submit"], button').contains(/salvar|agendar/i).click();
        
        // Verificar no calendário
        cy.get('.fc-event, .event').should('contain.text', agendamento.hora);
      });
    });

    it('Deve gerenciar status dos agendamentos', () => {
      cy.visit(`${baseUrl}/agendamentos`);
      
      // Confirmar agendamentos
      cy.get('.fc-event, .event').first().click();
      
      // Procurar por botões de ação
      cy.get('button').contains(/confirmar|atender/i).click();
      
      // Verificar mudança de status
      cy.get('body').should('contain.text', 'confirmado');
    });
  });

  describe('🏥 Atendimentos e Prontuários', () => {
    it('Deve criar prontuário médico', () => {
      cy.visit(`${baseUrl}/prontuario`);
      
      // Selecionar pet para atendimento
      cy.get('select[name="petId"], select').first().select(1);
      
      // Preencher prontuário
      cy.get('textarea[name="symptoms"], textarea').first()
        .clear()
        .type('Animal apresenta tosse seca e falta de apetite há 2 dias.');
      
      cy.get('textarea[name="diagnosis"], textarea').eq(1)
        .clear()
        .type('Suspeita de infecção respiratória leve.');
      
      cy.get('textarea[name="treatment"], textarea').eq(2)
        .clear()
        .type('Antibiótico por 7 dias, repouso e retorno em 1 semana.');
      
      // Salvar prontuário
      cy.get('button[type="submit"], button').contains(/salvar|registrar/i).click();
      
      // Verificar sucesso
      cy.get('body').should('contain.text', 'Prontuário');
    });

    it('Deve prescrever medicamentos', () => {
      cy.visit(`${baseUrl}/receituario`);
      
      // Criar nova receita
      cy.get('button, a').contains(/nova|criar/i).click();
      
      // Selecionar pet
      cy.get('select[name="petId"], select').first().select(1);
      
      // Adicionar medicamento
      cy.get('input[name="medication"], input').first()
        .clear()
        .type('Amoxicilina 250mg');
      
      cy.get('textarea[name="dosage"], textarea')
        .clear()
        .type('1 comprimido a cada 12 horas por 7 dias');
      
      // Salvar receita
      cy.get('button[type="submit"], button').contains(/salvar|gerar/i).click();
      
      // Verificar geração da receita
      cy.get('body').should('contain.text', 'Receita');
    });
  });

  describe('📦 Gestão de Estoque', () => {
    it('Deve cadastrar produtos no estoque', () => {
      cy.visit(`${baseUrl}/estoque`);
      
      dadosClinica.produtos.forEach((produto, index) => {
        // Clicar em novo produto
        cy.get('button, a').contains(/novo|adicionar/i).click();
        
        // Preencher dados do produto
        cy.get('input[name="name"], input[name="nome"]')
          .clear()
          .type(produto.nome);
        
        cy.get('select[name="category"], input[name="categoria"]')
          .first()
          .then($el => {
            if ($el.is('select')) {
              cy.wrap($el).select(produto.categoria);
            } else {
              cy.wrap($el).clear().type(produto.categoria);
            }
          });
        
        cy.get('input[name="price"], input[name="preco"]')
          .clear()
          .type(produto.preco.toString());
        
        cy.get('input[name="stock"], input[name="estoque"]')
          .clear()
          .type(produto.estoque.toString());
        
        // Salvar
        cy.get('button[type="submit"], button').contains(/salvar|cadastrar/i).click();
        
        // Verificar na lista
        cy.get('body').should('contain.text', produto.nome);
        
        // Voltar para lista se não for o último
        if (index < dadosClinica.produtos.length - 1) {
          cy.get('a, button').contains(/voltar|lista/i).click();
        }
      });
    });

    it('Deve verificar alertas de estoque baixo', () => {
      cy.visit(`${baseUrl}/estoque`);
      
      // Verificar se há alertas de estoque
      cy.get('body').then($body => {
        if ($body.text().includes('Estoque baixo') || $body.text().includes('Alerta')) {
          cy.get('.alert, .warning').should('be.visible');
        }
      });
    });
  });

  describe('💰 Gestão Financeira', () => {
    it('Deve gerar faturas para atendimentos', () => {
      cy.visit(`${baseUrl}/financeiro`);
      
      // Verificar se há faturas listadas
      cy.get('body').should('contain.text', 'R$');
      
      // Tentar criar nova fatura
      cy.get('button, a').contains(/nova|gerar/i).then($btn => {
        if ($btn.length > 0) {
          cy.wrap($btn).first().click();
          
          // Preencher dados da fatura
          cy.get('select[name="petId"], select').first().select(1);
          
          // Adicionar serviços
          cy.get('input[name="service"], input').first()
            .clear()
            .type('Consulta Veterinária');
          
          cy.get('input[name="value"], input[name="valor"]')
            .clear()
            .type('80.00');
          
          // Salvar fatura
          cy.get('button[type="submit"], button').contains(/salvar|gerar/i).click();
        }
      });
    });

    it('Deve visualizar relatórios financeiros', () => {
      cy.visit(`${baseUrl}/financeiro`);
      
      // Verificar elementos de relatório
      cy.get('body').should('contain.text', 'Total');
      cy.get('body').should('contain.text', 'R$');
      
      // Verificar se há gráficos ou tabelas
      cy.get('.chart, .table, table').should('exist');
    });
  });

  describe('⚙️ Configurações e Administração', () => {
    it('Deve acessar configurações da clínica', () => {
      cy.visit(`${baseUrl}/configuracoes`);
      
      // Verificar se a página carregou
      cy.get('h1, h2').should('contain.text', 'Configurações');
      
      // Verificar seções de configuração
      cy.get('body').should('contain.text', 'Clínica');
    });
  });

  describe('🌙 Fechamento da Clínica - Noite', () => {
    it('Deve verificar resumo do dia no dashboard', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Verificar estatísticas atualizadas
      cy.get('.card, [data-testid="stat-card"]').should('be.visible');
      
      // Verificar se há agendamentos concluídos
      cy.get('body').should('contain.text', 'Concluído');
      
      // Verificar receita do dia
      cy.get('body').should('contain.text', 'R$');
    });

    it('Deve fazer logout do sistema', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Procurar botão de logout
      cy.get('button, a').contains(/sair|logout/i).click();
      
      // Verificar se voltou para login
      cy.url().should('include', '/login');
    });
  });

  describe('📱 Testes de Responsividade', () => {
    it('Deve funcionar em dispositivos móveis', () => {
      cy.viewport('iphone-x');
      cy.visit(baseUrl);
      
      // Verificar se a página se adapta ao mobile
      cy.get('body').should('be.visible');
      
      // Testar navegação mobile
      cy.get('button[aria-label="menu"], .hamburger, .menu-toggle').then($menu => {
        if ($menu.length > 0) {
          cy.wrap($menu).click();
          cy.get('.menu, .nav').should('be.visible');
        }
      });
    });

    it('Deve funcionar em tablets', () => {
      cy.viewport('ipad-2');
      cy.visit(baseUrl);
      
      // Verificar layout em tablet
      cy.get('body').should('be.visible');
      cy.get('.container, .main').should('be.visible');
    });
  });

  describe('🚀 Testes de Performance', () => {
    it('Deve carregar páginas rapidamente', () => {
      const paginas = [
        '/dashboard',
        '/agendamentos',
        '/tutores',
        '/pets',
        '/estoque',
        '/financeiro'
      ];
      
      paginas.forEach(pagina => {
        const inicio = Date.now();
        cy.visit(`${baseUrl}${pagina}`);
        cy.get('body').should('be.visible').then(() => {
          const tempo = Date.now() - inicio;
          expect(tempo).to.be.lessThan(5000); // Menos de 5 segundos
        });
      });
    });

    it('Deve lidar com múltiplas requisições simultâneas', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Fazer várias ações rapidamente
      cy.get('a[href*="agendamentos"]').click();
      cy.wait(100);
      cy.get('a[href*="tutores"]').click();
      cy.wait(100);
      cy.get('a[href*="pets"]').click();
      
      // Verificar se não há erros
      cy.get('body').should('not.contain.text', 'Error');
      cy.get('body').should('not.contain.text', '500');
    });
  });

  afterEach(() => {
    // Capturar screenshot em caso de falha
    cy.screenshot({ capture: 'runner', onlyOnFailure: true });
  });
});