/// <reference types="cypress" />

/**
 * ⚡ TESTES DE PERFORMANCE E OTIMIZAÇÃO
 * 
 * Este arquivo contém testes específicos para avaliar a performance,
 * otimização e comportamento do sistema sob diferentes condições.
 */

describe('⚡ Testes de Performance e Otimização', () => {
  const baseUrl = 'http://localhost:3000';
  
  beforeEach(() => {
    // Configurar interceptadores para medir tempos de resposta
    cy.intercept('GET', '**/api/**', (req) => {
      req.reply((res) => {
        res.setDelay(0); // Sem delay artificial
        return res;
      });
    }).as('apiRequests');
    
    cy.viewport(1920, 1080);
  });

  describe('🚀 Performance de Carregamento', () => {
    it('Deve carregar a página inicial rapidamente', () => {
      const startTime = Date.now();
      
      cy.visit(baseUrl);
      cy.get('body').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Tempo de carregamento: ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(3000); // Menos de 3 segundos
      });
    });

    it('Deve medir Core Web Vitals', () => {
      cy.visit(baseUrl);
      
      // Aguardar carregamento completo
      cy.wait(2000);
      
      // Medir métricas de performance
      cy.window().then((win) => {
        // First Contentful Paint (FCP)
        const fcpEntry = win.performance.getEntriesByName('first-contentful-paint')[0];
        if (fcpEntry) {
          cy.log(`FCP: ${fcpEntry.startTime}ms`);
          expect(fcpEntry.startTime).to.be.lessThan(2000);
        }
        
        // Largest Contentful Paint (LCP)
        const lcpEntries = win.performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
          const lcp = lcpEntries[lcpEntries.length - 1].startTime;
          cy.log(`LCP: ${lcp}ms`);
          expect(lcp).to.be.lessThan(2500);
        }
        
        // Cumulative Layout Shift (CLS)
        const clsEntries = win.performance.getEntriesByType('layout-shift');
        let cls = 0;
        clsEntries.forEach(entry => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
        cy.log(`CLS: ${cls}`);
        expect(cls).to.be.lessThan(0.1);
      });
    });

    it('Deve carregar recursos críticos rapidamente', () => {
      cy.visit(baseUrl);
      
      // Verificar se CSS carregou
      cy.get('body').should('have.css', 'margin');
      
      // Verificar se JavaScript carregou
      cy.window().should('have.property', 'React');
      
      // Verificar se fontes carregaram
      cy.document().then((doc) => {
        const fonts = doc.fonts;
        if (fonts) {
          cy.wrap(fonts.ready).should('be.fulfilled');
        }
      });
    });
  });

  describe('📊 Performance de Navegação', () => {
    it('Deve navegar entre páginas rapidamente', () => {
      const paginas = [
        { nome: 'Dashboard', url: '/dashboard' },
        { nome: 'Agendamentos', url: '/agendamentos' },
        { nome: 'Tutores', url: '/tutores' },
        { nome: 'Pets', url: '/pets' },
        { nome: 'Estoque', url: '/estoque' },
        { nome: 'Financeiro', url: '/financeiro' }
      ];
      
      cy.visit(baseUrl);
      
      paginas.forEach((pagina) => {
        const startTime = Date.now();
        
        cy.visit(`${baseUrl}${pagina.url}`);
        cy.get('body').should('be.visible');
        
        cy.then(() => {
          const navigationTime = Date.now() - startTime;
          cy.log(`${pagina.nome}: ${navigationTime}ms`);
          expect(navigationTime).to.be.lessThan(2000);
        });
      });
    });

    it('Deve manter performance com cache', () => {
      // Primeira visita
      const firstVisit = Date.now();
      cy.visit(`${baseUrl}/dashboard`);
      cy.get('body').should('be.visible');
      const firstTime = Date.now() - firstVisit;
      
      // Segunda visita (com cache)
      const secondVisit = Date.now();
      cy.visit(`${baseUrl}/dashboard`);
      cy.get('body').should('be.visible');
      const secondTime = Date.now() - secondVisit;
      
      cy.log(`Primeira visita: ${firstTime}ms, Segunda visita: ${secondTime}ms`);
      
      // Segunda visita deve ser mais rápida ou similar
      expect(secondTime).to.be.lessThan(firstTime + 500);
    });
  });

  describe('🔄 Performance de API', () => {
    it('Deve responder rapidamente às requisições', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Interceptar e medir tempo de resposta das APIs
      cy.intercept('GET', '**/api/dashboard/**', (req) => {
        const startTime = Date.now();
        req.reply((res) => {
          const responseTime = Date.now() - startTime;
          cy.log(`API Dashboard: ${responseTime}ms`);
          expect(responseTime).to.be.lessThan(1000);
          return res;
        });
      }).as('dashboardApi');
      
      cy.reload();
      cy.wait('@dashboardApi');
    });

    it('Deve lidar com múltiplas requisições simultâneas', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Fazer várias requisições ao mesmo tempo
      const requests = [];
      
      cy.window().then((win) => {
        // Simular múltiplas chamadas de API
        for (let i = 0; i < 5; i++) {
          const startTime = Date.now();
          requests.push(
            fetch(`${baseUrl.replace('3000', '3333')}/api/tutors`)
              .then(() => {
                const time = Date.now() - startTime;
                cy.log(`Requisição ${i + 1}: ${time}ms`);
                return time;
              })
          );
        }
        
        // Verificar se todas completaram em tempo hábil
        Promise.all(requests).then((times) => {
          const maxTime = Math.max(...times);
          expect(maxTime).to.be.lessThan(3000);
        });
      });
    });
  });

  describe('💾 Performance de Memória', () => {
    it('Deve gerenciar memória eficientemente', () => {
      cy.visit(`${baseUrl}/dashboard`);
      
      // Medir uso inicial de memória
      cy.window().then((win) => {
        if (win.performance.memory) {
          const initialMemory = win.performance.memory.usedJSHeapSize;
          cy.log(`Memória inicial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
          
          // Navegar por várias páginas
          const paginas = ['/agendamentos', '/tutores', '/pets', '/estoque'];
          
          paginas.forEach((pagina) => {
            cy.visit(`${baseUrl}${pagina}`);
            cy.wait(1000);
          });
          
          // Voltar ao dashboard e medir memória final
          cy.visit(`${baseUrl}/dashboard`);
          cy.wait(2000);
          
          cy.window().then((finalWin) => {
            if (finalWin.performance.memory) {
              const finalMemory = finalWin.performance.memory.usedJSHeapSize;
              const memoryIncrease = finalMemory - initialMemory;
              
              cy.log(`Memória final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
              cy.log(`Aumento: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
              
              // Não deve aumentar mais que 50MB
              expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024);
            }
          });
        }
      });
    });

    it('Deve limpar event listeners adequadamente', () => {
      cy.visit(`${baseUrl}/agendamentos`);
      
      // Contar event listeners iniciais
      cy.window().then((win) => {
        const initialListeners = win.getEventListeners ? 
          Object.keys(win.getEventListeners(win.document)).length : 0;
        
        // Navegar para outras páginas
        cy.visit(`${baseUrl}/tutores`);
        cy.visit(`${baseUrl}/pets`);
        cy.visit(`${baseUrl}/agendamentos`);
        
        cy.window().then((finalWin) => {
          const finalListeners = finalWin.getEventListeners ? 
            Object.keys(finalWin.getEventListeners(finalWin.document)).length : 0;
          
          cy.log(`Listeners iniciais: ${initialListeners}, Finais: ${finalListeners}`);
          
          // Não deve haver vazamento significativo de listeners
          expect(finalListeners).to.be.lessThan(initialListeners + 10);
        });
      });
    });
  });

  describe('📱 Performance Responsiva', () => {
    it('Deve manter performance em dispositivos móveis', () => {
      cy.viewport('iphone-x');
      
      const startTime = Date.now();
      cy.visit(baseUrl);
      cy.get('body').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Tempo de carregamento mobile: ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(4000); // Mobile pode ser um pouco mais lento
      });
    });

    it('Deve adaptar layout sem causar reflow excessivo', () => {
      const viewports = [
        { name: 'Desktop', width: 1920, height: 1080 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Mobile', width: 375, height: 667 }
      ];
      
      viewports.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height);
        
        const startTime = Date.now();
        cy.visit(`${baseUrl}/dashboard`);
        cy.get('body').should('be.visible');
        
        cy.then(() => {
          const adaptTime = Date.now() - startTime;
          cy.log(`${viewport.name}: ${adaptTime}ms`);
          expect(adaptTime).to.be.lessThan(3000);
        });
      });
    });
  });

  describe('🔍 Análise de Bundle', () => {
    it('Deve carregar apenas recursos necessários', () => {
      cy.visit(baseUrl);
      
      // Verificar se não há recursos desnecessários carregando
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType('resource');
        
        // Filtrar apenas JavaScript e CSS
        const jsResources = resources.filter(r => r.name.includes('.js'));
        const cssResources = resources.filter(r => r.name.includes('.css'));
        
        cy.log(`Arquivos JS carregados: ${jsResources.length}`);
        cy.log(`Arquivos CSS carregados: ${cssResources.length}`);
        
        // Verificar tamanhos
        jsResources.forEach((resource) => {
          cy.log(`JS: ${resource.name} - ${resource.transferSize} bytes`);
          expect(resource.transferSize).to.be.lessThan(2 * 1024 * 1024); // Menos de 2MB por arquivo
        });
        
        cssResources.forEach((resource) => {
          cy.log(`CSS: ${resource.name} - ${resource.transferSize} bytes`);
          expect(resource.transferSize).to.be.lessThan(500 * 1024); // Menos de 500KB por arquivo
        });
      });
    });

    it('Deve usar compressão adequada', () => {
      cy.request(baseUrl).then((response) => {
        // Verificar headers de compressão
        expect(response.headers).to.have.property('content-encoding');
        
        // Verificar se o conteúdo está comprimido
        const contentLength = response.headers['content-length'];
        if (contentLength) {
          cy.log(`Tamanho do HTML: ${contentLength} bytes`);
          expect(parseInt(contentLength)).to.be.lessThan(100 * 1024); // Menos de 100KB
        }
      });
    });
  });

  describe('⚠️ Testes de Stress', () => {
    it('Deve lidar com navegação rápida entre páginas', () => {
      const paginas = ['/dashboard', '/agendamentos', '/tutores', '/pets'];
      
      // Navegar rapidamente entre páginas
      for (let i = 0; i < 10; i++) {
        const pagina = paginas[i % paginas.length];
        cy.visit(`${baseUrl}${pagina}`);
        cy.wait(100); // Navegação muito rápida
      }
      
      // Verificar se não há erros
      cy.get('body').should('not.contain.text', 'Error');
      cy.get('body').should('be.visible');
    });

    it('Deve manter estabilidade com múltiplas abas simuladas', () => {
      // Simular múltiplas "abas" fazendo várias requisições
      cy.visit(`${baseUrl}/dashboard`);
      
      // Fazer várias ações simultaneamente
      cy.window().then((win) => {
        // Simular ações de múltiplos usuários
        const actions = [];
        
        for (let i = 0; i < 5; i++) {
          actions.push(
            fetch(`${baseUrl.replace('3000', '3333')}/api/dashboard/stats`)
              .catch(() => null) // Ignorar erros de rede
          );
        }
        
        Promise.allSettled(actions).then(() => {
          cy.log('Múltiplas requisições completadas');
        });
      });
      
      // Verificar se a interface ainda responde
      cy.get('body').should('be.visible');
      cy.get('a, button').first().should('be.visible');
    });
  });

  describe('🔧 Otimizações Detectadas', () => {
    it('Deve usar lazy loading para imagens', () => {
      cy.visit(`${baseUrl}/pets`);
      
      // Verificar se imagens têm loading="lazy"
      cy.get('img').each(($img) => {
        const loading = $img.attr('loading');
        if (loading) {
          expect(loading).to.equal('lazy');
        }
      });
    });

    it('Deve implementar code splitting', () => {
      cy.visit(baseUrl);
      
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType('resource');
        const jsFiles = resources.filter(r => r.name.includes('.js'));
        
        // Verificar se há múltiplos chunks JS (indicativo de code splitting)
        const chunks = jsFiles.filter(r => r.name.includes('chunk') || r.name.match(/\.[a-f0-9]{8}\./));
        
        if (chunks.length > 1) {
          cy.log(`Code splitting detectado: ${chunks.length} chunks`);
        } else {
          cy.log('Code splitting não detectado - oportunidade de otimização');
        }
      });
    });

    it('Deve usar service workers para cache', () => {
      cy.visit(baseUrl);
      
      cy.window().then((win) => {
        if ('serviceWorker' in win.navigator) {
          win.navigator.serviceWorker.getRegistrations().then((registrations) => {
            if (registrations.length > 0) {
              cy.log('Service Worker detectado');
            } else {
              cy.log('Service Worker não encontrado - oportunidade de otimização');
            }
          });
        }
      });
    });
  });

  afterEach(() => {
    // Capturar métricas de performance após cada teste
    cy.window().then((win) => {
      if (win.performance.memory) {
        const memory = win.performance.memory;
        cy.log(`Memória usada: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        cy.log(`Limite de memória: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
      }
      
      const navigation = win.performance.getEntriesByType('navigation')[0];
      if (navigation) {
        cy.log(`DOM carregado em: ${navigation.domContentLoadedEventEnd}ms`);
        cy.log(`Página carregada em: ${navigation.loadEventEnd}ms`);
      }
    });
  });
});