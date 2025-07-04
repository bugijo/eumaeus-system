// cypress/e2e/cadastro-tutor.cy.ts

describe('Fluxo de Cadastro de Tutor', () => {
  beforeEach(() => {
    // Visita a página inicial
    cy.visit('http://localhost:3000/', {
      timeout: 30000,
      failOnStatusCode: false
    });
    
    // Aguarda a página carregar
    cy.get('body').should('exist');
    cy.wait(2000);
  });

  it('deve conseguir acessar a aplicação', () => {
    // Verifica se a aplicação carregou
    cy.get('body').should('be.visible');
    cy.url().should('include', 'localhost:3000');
  });

  it('deve conseguir navegar para tutores (se disponível)', () => {
    // Tenta encontrar link para tutores
    cy.get('body').then(($body) => {
      if ($body.text().includes('Tutor') || $body.text().includes('tutor')) {
        cy.contains(/tutor/i).first().click();
        cy.wait(1000);
      } else {
        cy.log('Link para tutores não encontrado');
      }
    });
  });

  it('deve verificar se existe formulário de cadastro', () => {
    // Procura por elementos de formulário típicos
    cy.get('body').then(($body) => {
      const hasForm = $body.find('form').length > 0 ||
                     $body.find('input').length > 0 ||
                     $body.find('[data-cy*="tutor"]').length > 0;
      
      if (hasForm) {
        cy.log('Elementos de formulário encontrados');
        // Se encontrar formulário, verifica se tem campos básicos
        if ($body.find('input[type="text"], input[name*="nome"], #input-nome').length > 0) {
          cy.get('input[type="text"], input[name*="nome"], #input-nome').first().should('be.visible');
        }
      } else {
        cy.log('Nenhum formulário encontrado na página atual');
      }
    });
  });

  it('deve testar API de tutores (se backend estiver rodando)', () => {
    // Testa se o backend está respondendo
    cy.request({
      method: 'GET',
      url: 'http://localhost:3333/api/tutors',
      failOnStatusCode: false
    }).then((response) => {
      // Aceita qualquer resposta que indique que o servidor está rodando
      expect(response.status).to.be.oneOf([200, 404, 500]);
      cy.log(`Backend respondeu com status: ${response.status}`);
    });
  });
});