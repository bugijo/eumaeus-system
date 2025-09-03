/// <reference types="cypress" />

/**
 * 🎨 TESTES DE UI/UX E ANÁLISE VISUAL
 * 
 * Este arquivo contém testes específicos para avaliar a interface do usuário,
 * experiência do usuário, acessibilidade e problemas visuais.
 */

describe('🎨 Análise de UI/UX e Problemas Visuais', () => {
  const baseUrl = 'http://localhost:3000';
  
  beforeEach(() => {
    cy.viewport(1920, 1080);
  });

  describe('🖼️ Análise Visual Geral', () => {
    it('Deve ter layout consistente em todas as páginas', () => {
      const paginas = [
        '/dashboard',
        '/agendamentos', 
        '/tutores',
        '/pets',
        '/estoque',
        '/financeiro',
        '/configuracoes'
      ];
      
      paginas.forEach((pagina) => {
        cy.visit(`${baseUrl}${pagina}`);
        
        // Verificar elementos de layout básicos
        cy.get('header, .header, nav, .nav').should('be.visible');
        cy.get('main, .main, .content').should('be.visible');
        
        // Verificar se não há elementos sobrepostos
        cy.get('body').should('not.have.css', 'overflow-x', 'scroll');
        
        // Verificar se há título da página
        cy.get('h1, h2, .page-title').should('be.visible');
        
        // Screenshot para análise visual
        cy.screenshot(`layout-${pagina.replace('/', '')}`);
      });
    });

    it('Deve ter cores e tipografia consistentes', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Verificar se há definição de cores CSS
      cy.get('body').should('have.css', 'color');
      cy.get('body').should('have.css', 'font-family');
      
      // Verificar contraste de cores
      cy.get('button, .btn').each(($btn) => {
        cy.wrap($btn).should('be.visible');
        
        // Verificar se botões têm cores definidas
        cy.wrap($btn).should('have.css', 'background-color');
        cy.wrap($btn).should('have.css', 'color');
      });
      
      // Verificar hierarquia tipográfica
      cy.get('h1').should('have.css', 'font-size');
      cy.get('h2').should('have.css', 'font-size');
      cy.get('p, span').should('have.css', 'font-size');
    });

    it('Deve ter espaçamento adequado entre elementos', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Verificar margens e paddings
      cy.get('.card, .component').each(($el) => {
        cy.wrap($el).should('have.css', 'margin');
        cy.wrap($el).should('have.css', 'padding');
      });
      
      // Verificar se elementos não estão colados
      cy.get('button + button, .btn + .btn').each(($btn) => {
        const marginLeft = parseInt($btn.css('margin-left'));
        const marginRight = parseInt($btn.prev().css('margin-right'));
        expect(marginLeft + marginRight).to.be.greaterThan(0);
      });
    });
  });

  describe('📱 Responsividade e Adaptação', () => {
    it('Deve adaptar corretamente para mobile', () => {
      const mobileViewports = [
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPhone 12', width: 390, height: 844 },
        { name: 'Samsung Galaxy', width: 360, height: 740 }
      ];
      
      mobileViewports.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit(`${baseUrl}/dashboard`);
        
        // Verificar se não há scroll horizontal
        cy.get('body').should('not.have.css', 'overflow-x', 'scroll');
        
        // Verificar se elementos cabem na tela
        cy.get('.container, .main').should('have.css', 'width').then((width) => {
          const widthValue = parseInt(width);
          expect(widthValue).to.be.lessThan(viewport.width + 20);
        });
        
        // Verificar menu mobile
        cy.get('body').then(($body) => {
          if ($body.find('.hamburger, .menu-toggle, [aria-label="menu"]').length > 0) {
            cy.get('.hamburger, .menu-toggle, [aria-label="menu"]').should('be.visible');
          }
        });
        
        cy.screenshot(`mobile-${viewport.name.replace(' ', '-')}-dashboard`);
      });
    });

    it('Deve adaptar corretamente para tablet', () => {
      const tabletViewports = [
        { name: 'iPad', width: 768, height: 1024 },
        { name: 'iPad Pro', width: 1024, height: 1366 }
      ];
      
      tabletViewports.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit(`${baseUrl}/agendamentos`);
        
        // Verificar layout em tablet
        cy.get('body').should('be.visible');
        
        // Verificar se calendário se adapta
        cy.get('.fc, .calendar').should('be.visible');
        
        cy.screenshot(`tablet-${viewport.name.replace(' ', '-')}-agendamentos`);
      });
    });

    it('Deve manter usabilidade em telas pequenas', () => {
      cy.viewport(320, 568); // iPhone 5
      cy.visit(`${baseUrl}/tutores`);
      
      // Verificar se botões são clicáveis
      cy.get('button, .btn').each(($btn) => {
        cy.wrap($btn).should('have.css', 'min-height').then((height) => {
          const heightValue = parseInt(height);
          expect(heightValue).to.be.greaterThan(40); // Mínimo 40px para touch
        });
      });
      
      // Verificar se texto é legível
      cy.get('p, span, div').each(($text) => {
        cy.wrap($text).should('have.css', 'font-size').then((fontSize) => {
          const sizeValue = parseInt(fontSize);
          expect(sizeValue).to.be.greaterThan(14); // Mínimo 14px
        });
      });
    });
  });

  describe('🎯 Usabilidade e Interação', () => {
    it('Deve ter feedback visual para interações', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Verificar hover em botões
      cy.get('button, .btn').first().then(($btn) => {
        const originalColor = $btn.css('background-color');
        
        cy.wrap($btn).trigger('mouseover');
        cy.wrap($btn).should('not.have.css', 'background-color', originalColor);
        
        cy.wrap($btn).trigger('mouseout');
      });
      
      // Verificar focus em inputs
      cy.get('input').first().then(($input) => {
        cy.wrap($input).focus();
        cy.wrap($input).should('have.css', 'outline').and('not.equal', 'none');
      });
    });

    it('Deve ter estados de loading visíveis', () => {
      cy.visit(`${baseUrl}/agendamentos`);
      
      // Procurar por indicadores de loading
      cy.get('body').then(($body) => {
        if ($body.find('.loading, .spinner, .skeleton').length > 0) {
          cy.get('.loading, .spinner, .skeleton').should('be.visible');
        }
      });
      
      // Verificar se botões ficam desabilitados durante loading
      cy.get('button[type="submit"]').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn).click();
          cy.wrap($btn).should('have.attr', 'disabled');
        }
      });
    });

    it('Deve ter mensagens de erro claras', () => {
      cy.visit(`${baseUrl}/tutores`);
      
      // Tentar submeter formulário vazio
      cy.get('form').then(($form) => {
        if ($form.length > 0) {
          cy.get('button[type="submit"]').click();
          
          // Verificar se há mensagens de erro
          cy.get('.error, .invalid, [role="alert"]').should('be.visible');
          
          // Verificar se mensagens são específicas
          cy.get('.error, .invalid, [role="alert"]').should('not.contain.text', 'Error');
          cy.get('.error, .invalid, [role="alert"]').should('not.be.empty');
        }
      });
    });

    it('Deve ter navegação intuitiva', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Verificar breadcrumbs
      cy.get('.breadcrumb, .breadcrumbs').then(($breadcrumb) => {
        if ($breadcrumb.length > 0) {
          cy.wrap($breadcrumb).should('be.visible');
          cy.wrap($breadcrumb).find('a, span').should('have.length.greaterThan', 0);
        }
      });
      
      // Verificar menu de navegação
      cy.get('nav, .nav, .sidebar').should('be.visible');
      cy.get('nav a, .nav a, .sidebar a').should('have.length.greaterThan', 3);
      
      // Verificar se links têm texto descritivo
      cy.get('nav a, .nav a, .sidebar a').each(($link) => {
        cy.wrap($link).should('not.be.empty');
        cy.wrap($link).should('have.attr', 'href');
      });
    });
  });

  describe('♿ Acessibilidade', () => {
    it('Deve ter estrutura semântica adequada', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Verificar elementos semânticos
      cy.get('header').should('exist');
      cy.get('main').should('exist');
      cy.get('nav').should('exist');
      
      // Verificar hierarquia de headings
      cy.get('h1').should('have.length', 1);
      cy.get('h1, h2, h3, h4, h5, h6').each(($heading, index, $headings) => {
        const tagName = $heading.prop('tagName');
        const level = parseInt(tagName.charAt(1));
        
        if (index > 0) {
          const prevTagName = $headings.eq(index - 1).prop('tagName');
          const prevLevel = parseInt(prevTagName.charAt(1));
          
          // Não deve pular níveis
          expect(level - prevLevel).to.be.lessThan(2);
        }
      });
    });

    it('Deve ter atributos ARIA adequados', () => {
      cy.visit(`${baseUrl}/agendamentos`);
      
      // Verificar labels em inputs
      cy.get('input').each(($input) => {
        const id = $input.attr('id');
        const ariaLabel = $input.attr('aria-label');
        const ariaLabelledby = $input.attr('aria-labelledby');
        
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        } else {
          expect(ariaLabel || ariaLabelledby).to.exist;
        }
      });
      
      // Verificar botões com ações
      cy.get('button').each(($btn) => {
        const text = $btn.text().trim();
        const ariaLabel = $btn.attr('aria-label');
        
        expect(text || ariaLabel).to.exist;
        expect(text || ariaLabel).to.not.be.empty;
      });
      
      // Verificar roles em elementos interativos
      cy.get('[role="button"], [role="link"], [role="tab"]').each(($el) => {
        cy.wrap($el).should('be.visible');
      });
    });

    it('Deve ser navegável por teclado', () => {
      cy.visit(`${baseUrl}/tutores`);
      
      // Verificar se elementos focáveis têm outline
      cy.get('a, button, input, select, textarea').each(($el) => {
        cy.wrap($el).focus();
        cy.wrap($el).should('have.css', 'outline').and('not.equal', 'none');
      });
      
      // Testar navegação por Tab
      cy.get('body').tab();
      cy.focused().should('be.visible');
      
      // Verificar se skip links existem
      cy.get('body').then(($body) => {
        if ($body.find('.skip-link, [href="#main"]').length > 0) {
          cy.get('.skip-link, [href="#main"]').should('exist');
        }
      });
    });

    it('Deve ter contraste adequado', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Verificar contraste em textos principais
      cy.get('h1, h2, h3, p').each(($text) => {
        cy.wrap($text).should('be.visible');
        
        // Verificar se texto não está muito claro
        cy.wrap($text).should('have.css', 'color').then((color) => {
          // Converter RGB para verificar se não é muito claro
          const rgb = color.match(/\d+/g);
          if (rgb) {
            const [r, g, b] = rgb.map(Number);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            expect(luminance).to.not.be.greaterThan(0.9); // Não muito claro
          }
        });
      });
    });
  });

  describe('🔍 Detecção de Problemas Específicos', () => {
    it('Deve detectar elementos sobrepostos', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Verificar se há elementos com z-index conflitantes
      cy.get('[style*="z-index"], .modal, .dropdown').each(($el) => {
        cy.wrap($el).should('be.visible');
        
        // Verificar se elemento não está cortado
        cy.wrap($el).then(($element) => {
          const rect = $element[0].getBoundingClientRect();
          expect(rect.width).to.be.greaterThan(0);
          expect(rect.height).to.be.greaterThan(0);
        });
      });
    });

    it('Deve detectar imagens quebradas', () => {
      cy.visit(`${baseUrl}/pets`);
      
      // Verificar todas as imagens
      cy.get('img').each(($img) => {
        cy.wrap($img).should('be.visible');
        
        // Verificar se imagem carregou
        cy.wrap($img).should(($el) => {
          expect($el[0].naturalWidth).to.be.greaterThan(0);
        });
        
        // Verificar se tem alt text
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('Deve detectar links quebrados', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Verificar links internos
      cy.get('a[href^="/"], a[href^="#"]').each(($link) => {
        const href = $link.attr('href');
        
        if (href && href !== '#' && !href.includes('javascript:')) {
          cy.request({
            url: `${baseUrl}${href}`,
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.be.lessThan(400);
          });
        }
      });
    });

    it('Deve detectar problemas de performance visual', () => {
      cy.visit(`${baseUrl}/agendamentos`);
      
      // Verificar se há muitas animações simultâneas
      cy.get('[style*="animation"], .animate').then(($animated) => {
        if ($animated.length > 5) {
          cy.log(`Muitas animações detectadas: ${$animated.length}`);
        }
      });
      
      // Verificar se há elementos muito grandes
      cy.get('*').each(($el) => {
        const rect = $el[0].getBoundingClientRect();
        if (rect.width > 2000 || rect.height > 2000) {
          cy.log(`Elemento muito grande detectado: ${rect.width}x${rect.height}`);
        }
      });
    });

    it('Deve detectar problemas de formulários', () => {
      cy.visit(`${baseUrl}/tutores`);
      
      // Verificar se inputs têm labels
      cy.get('input, select, textarea').each(($input) => {
        const id = $input.attr('id');
        const name = $input.attr('name');
        const placeholder = $input.attr('placeholder');
        const ariaLabel = $input.attr('aria-label');
        
        // Deve ter pelo menos uma forma de identificação
        const hasLabel = id && Cypress.$(`label[for="${id}"]`).length > 0;
        const hasIdentification = hasLabel || ariaLabel || placeholder;
        
        expect(hasIdentification).to.be.true;
      });
      
      // Verificar se formulários têm validação
      cy.get('form').each(($form) => {
        const requiredInputs = $form.find('input[required], select[required]');
        if (requiredInputs.length > 0) {
          cy.wrap($form).find('button[type="submit"]').should('exist');
        }
      });
    });
  });

  describe('🎨 Análise de Design System', () => {
    it('Deve usar componentes consistentes', () => {
      const paginas = ['/dashboard', '/tutores', '/pets'];
      const componentStyles = {};
      
      paginas.forEach((pagina) => {
        cy.visit(`${baseUrl}${pagina}`);
        
        // Coletar estilos de botões
        cy.get('button, .btn').first().then(($btn) => {
          const styles = {
            borderRadius: $btn.css('border-radius'),
            padding: $btn.css('padding'),
            fontSize: $btn.css('font-size')
          };
          
          if (!componentStyles.button) {
            componentStyles.button = styles;
          } else {
            // Verificar consistência
            expect(styles.borderRadius).to.equal(componentStyles.button.borderRadius);
            expect(styles.fontSize).to.equal(componentStyles.button.fontSize);
          }
        });
        
        // Coletar estilos de cards
        cy.get('.card, .component').first().then(($card) => {
          if ($card.length > 0) {
            const styles = {
              borderRadius: $card.css('border-radius'),
              boxShadow: $card.css('box-shadow')
            };
            
            if (!componentStyles.card) {
              componentStyles.card = styles;
            } else {
              expect(styles.borderRadius).to.equal(componentStyles.card.borderRadius);
            }
          }
        });
      });
    });

    it('Deve ter paleta de cores definida', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Verificar se há variáveis CSS definidas
      cy.window().then((win) => {
        const styles = win.getComputedStyle(win.document.documentElement);
        const cssVars = [];
        
        for (let i = 0; i < styles.length; i++) {
          const prop = styles[i];
          if (prop.startsWith('--')) {
            cssVars.push(prop);
          }
        }
        
        if (cssVars.length > 0) {
          cy.log(`Variáveis CSS encontradas: ${cssVars.length}`);
        } else {
          cy.log('Nenhuma variável CSS encontrada - oportunidade de melhoria');
        }
      });
    });
  });

  afterEach(() => {
    // Capturar screenshot para análise visual
    cy.screenshot({ capture: 'viewport', onlyOnFailure: false });
  });
});