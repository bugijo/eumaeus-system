# 🚀 GUIA DE DEPLOY PARA PRODUÇÃO - V2.0

## 📋 CHECKLIST FINAL ANTES DO DEPLOY

### ✅ PRÉ-REQUISITOS VALIDADOS
- [x] Todos os testes de regressão passaram (6/6)
- [x] Script de migração testado e funcional
- [x] Variáveis de ambiente documentadas
- [x] Sistema funcionando localmente
- [x] Backup do banco atual realizado

---

## 🔧 CONFIGURAÇÃO DO RENDER (Backend)

### 1️⃣ Acessar Dashboard do Render
1. Acesse [render.com](https://render.com)
2. Faça login na sua conta
3. Vá para o seu serviço backend existente

### 2️⃣ Configurar Variáveis de Ambiente
Vá em **Environment** e adicione as seguintes variáveis:

#### 🗄️ Banco de Dados
```env
DATABASE_URL=postgresql://username:password@host:port/database
```
*Nota: O Render fornece automaticamente se você tem um PostgreSQL conectado*

#### 🔐 Autenticação
```env
JWT_SECRET=seu_jwt_secret_super_seguro_de_pelo_menos_32_caracteres
REFRESH_TOKEN_SECRET=seu_refresh_token_secret_diferente_do_jwt
```
*⚠️ IMPORTANTE: Use strings longas e aleatórias*

#### 📧 Sistema de Email (Automação)
```env
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app_do_gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```
*Nota: Use senha de app do Gmail, não a senha principal*

#### 💰 Focus NFe (Opcional)
```env
FOCUS_NFE_TOKEN=seu_token_focus_nfe
FOCUS_NFE_ENVIRONMENT=sandbox
```
*Inicie com sandbox, mude para production após testes*

#### ⚙️ Configurações Gerais
```env
PORT=3333
NODE_ENV=production
```

### 3️⃣ Deploy do Backend
1. Clique em **Manual Deploy** ou aguarde o auto-deploy
2. Monitore os logs de build
3. Verifique se o serviço está rodando

---

## 🌐 CONFIGURAÇÃO DA VERCEL (Frontend)

### 1️⃣ Acessar Dashboard da Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login na sua conta
3. Vá para o seu projeto frontend

### 2️⃣ Configurar Variáveis de Ambiente
Vá em **Settings** > **Environment Variables** e adicione:

#### 🔗 API
```env
VITE_API_URL=https://seu-backend.onrender.com
```
*Substitua pela URL real do seu backend no Render*

#### 📱 Aplicação
```env
VITE_APP_NAME=Eumaeus System
VITE_APP_VERSION=2.0.0
VITE_NODE_ENV=production
```

### 3️⃣ Deploy do Frontend
1. Clique em **Redeploy** ou faça um novo commit
2. Monitore o build
3. Teste a aplicação

---

## 🔄 EXECUTAR MIGRAÇÃO EM PRODUÇÃO

### 1️⃣ Backup do Banco
```bash
# Se usando PostgreSQL no Render
pg_dump $DATABASE_URL > backup_pre_v2.sql
```

### 2️⃣ Executar Migrações
```bash
# No terminal do Render ou localmente conectado ao banco de produção
npx prisma migrate deploy
```

### 3️⃣ Executar Script de Migração V2
```bash
# Executar o script de migração de dados
npx ts-node prisma/migrate-v2.ts
```

### 4️⃣ Verificar Integridade
```bash
# Verificar se todos os usuários têm AuthProfile
npx prisma studio
# Ou fazer uma query direta
```

---

## 🧪 TESTES PÓS-DEPLOY

### 1️⃣ Teste de Login
- [ ] Acessar a aplicação em produção
- [ ] Fazer login com `admin@Eumaeus.com`
- [ ] Verificar redirecionamento
- [ ] Testar logout

### 2️⃣ Teste de Funcionalidades Básicas
- [ ] Criar um tutor
- [ ] Visualizar agenda
- [ ] Acessar dashboard
- [ ] Verificar estatísticas

### 3️⃣ Teste de Novas Funcionalidades V2.0
- [ ] Acessar configurações da clínica
- [ ] Testar sistema de automação
- [ ] Verificar receituário (se implementado)
- [ ] Testar produtos/estoque

### 4️⃣ Teste de Performance
- [ ] Tempo de carregamento < 3s
- [ ] Responsividade mobile
- [ ] Navegação fluida
- [ ] Sem erros no console

---

## 🚨 PLANO DE ROLLBACK

### Em Caso de Problemas Críticos:

#### 1️⃣ Rollback Imediato
```bash
# Reverter para commit anterior
git revert HEAD
git push origin main
```

#### 2️⃣ Restaurar Banco
```bash
# Restaurar backup
psql $DATABASE_URL < backup_pre_v2.sql
```

#### 3️⃣ Comunicação
- Notificar usuários sobre manutenção
- Documentar problemas encontrados
- Planejar correções

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### 1️⃣ Logs do Render
- Verificar logs de erro
- Monitorar performance
- Acompanhar uso de recursos

### 2️⃣ Logs da Vercel
- Verificar builds
- Monitorar erros de frontend
- Acompanhar métricas de usuário

### 3️⃣ Sistema de Email
- Testar envio de lembretes
- Verificar configurações SMTP
- Monitorar taxa de entrega

### 4️⃣ Banco de Dados
- Verificar integridade dos dados
- Monitorar performance de queries
- Acompanhar crescimento

---

## 🎯 CHECKLIST FINAL DE DEPLOY

### ✅ Antes do Deploy
- [ ] Todas as variáveis configuradas no Render
- [ ] Todas as variáveis configuradas na Vercel
- [ ] Backup do banco realizado
- [ ] Plano de rollback documentado
- [ ] Equipe notificada sobre deploy

### ✅ Durante o Deploy
- [ ] Backend deployado com sucesso
- [ ] Frontend deployado com sucesso
- [ ] Migrações executadas
- [ ] Script V2 executado
- [ ] Logs verificados

### ✅ Após o Deploy
- [ ] Login testado em produção
- [ ] Funcionalidades básicas testadas
- [ ] Novas features validadas
- [ ] Performance verificada
- [ ] Usuários notificados

---

## 📞 CONTATOS DE EMERGÊNCIA

### 🆘 Suporte Técnico
- **Render**: [render.com/support](https://render.com/support)
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Gmail**: [support.google.com](https://support.google.com)

### 🔗 Links Úteis
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Prisma Deploy](https://www.prisma.io/docs/guides/deployment)

---

## 🎉 COMUNICAÇÃO PARA USUÁRIOS

### 📧 Template de Email
```
Assunto: 🚀 Eumaeus V2.0 - Novas Funcionalidades Disponíveis!

Olá!

Temos o prazer de anunciar o lançamento da versão 2.0 do Eumaeus System!

🆕 Novidades:
• 💊 Receituário Digital
• 🤖 Sistema de Lembretes Automáticos
• ⚙️ Configurações Personalizáveis
• 📊 Dashboard Aprimorado

⚠️ IMPORTANTE:
Se você é um funcionário da clínica e sua senha não funcionar, 
use a senha temporária "mudar123" e altere-a no primeiro login.

Qualquer dúvida, entre em contato conosco.

Equipe Eumaeus
```

---

**🎯 OBJETIVO: Deploy seguro e bem-sucedido da V2.0 em produção!**