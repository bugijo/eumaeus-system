# Configuração do GitHub Actions com Cypress

## 📋 Passo a Passo para Configurar os Secrets

Para que o GitHub Actions execute os testes Cypress corretamente, você precisa configurar um secret com a URL da API de produção.

### 1. Acessar as Configurações do Repositório

1. Vá para o seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**

### 2. Criar o Secret

1. Clique em **"New repository secret"**
2. Preencha os campos:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://Eumaeus-backend.onrender.com/api`
3. Clique em **"Add secret"**

### 3. Verificar a Configuração

Após configurar o secret, a cada push para as branches `main` ou `develop`, o GitHub Actions irá:

✅ Fazer checkout do código
✅ Configurar Node.js 20
✅ Instalar dependências
✅ Iniciar o servidor de desenvolvimento
✅ Executar todos os testes Cypress
✅ Usar a URL da API de produção nos testes

### 4. Monitorar os Testes

Você pode acompanhar a execução dos testes na aba **Actions** do seu repositório GitHub.

## 🚀 Benefícios

- **Automação completa:** Testes executados automaticamente a cada mudança
- **Detecção precoce:** Problemas identificados antes do deploy
- **Confiabilidade:** Garante que a aplicação funciona corretamente
- **Profissionalização:** Processo de CI/CD robusto

## 📝 Arquivos Criados

- `.github/workflows/ci.yml` - Configuração do workflow do GitHub Actions
- `cypress.ci.config.js` - Configuração específica do Cypress para CI/CD
- `cypress/e2e/ci-main-flow.cy.ts` - Teste principal otimizado para CI/CD
- `GITHUB_ACTIONS_SETUP.md` - Este arquivo de documentação

## 🔧 Funcionalidades do CI/CD

### Testes Executados
- **Teste Principal (ci-main-flow.cy.ts):** Verifica conectividade, navegação e integração
- **Teste de Integração Final:** Valida fluxos completos da aplicação

### Recursos Avançados
- **Retry automático:** Testes falham? Tentam novamente automaticamente
- **Screenshots e vídeos:** Em caso de falha, salva evidências
- **Timeouts otimizados:** Configurados para ambiente de CI
- **Upload de artefatos:** Screenshots e vídeos disponíveis por 7 dias

### Monitoramento
- Acesse **Actions** no GitHub para ver execução em tempo real
- Downloads de artefatos disponíveis em caso de falha
- Logs detalhados de cada etapa

---

**Importante:** Nunca commite URLs de API diretamente no código. Sempre use secrets para informações sensíveis!