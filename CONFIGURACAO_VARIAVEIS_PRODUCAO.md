# ⚙️ CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE - PRODUÇÃO

## 🎯 PRÓXIMO PASSO CRÍTICO
**Status**: 🔴 URGENTE - Configurar antes do deploy funcionar  
**Tempo Estimado**: 15-20 minutos  
**Prioridade**: ALTA  

---

## 🖥️ RENDER (BACKEND) - CONFIGURAÇÃO

### 📍 ACESSO
1. **Login**: [https://dashboard.render.com](https://dashboard.render.com)
2. **Projeto**: Localizar `pulsevet-backend` ou similar
3. **Configurações**: Environment → Environment Variables

### 🔧 VARIÁVEIS OBRIGATÓRIAS

#### 🗄️ Banco de Dados
```env
DATABASE_URL=postgresql://pulsevet_db_user:VJHnvnF2uwgLg3MwMdgEvdyae5zdxZ7P@dpg-d1jh806mcj7s739repog-a.ohio-postgres.render.com/pulsevet_db
```

#### 🔐 Autenticação JWT
```env
JWT_SECRET=pulsevet_jwt_super_secret_key_2025_v2
REFRESH_TOKEN_SECRET=pulsevet_refresh_token_secret_2025_v2
```

#### 📧 Sistema de Email (Gmail)
```env
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app_gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

#### 💰 Focus NFe (Opcional)
```env
FOCUS_NFE_TOKEN=seu_token_focus_nfe_aqui
FOCUS_NFE_ENVIRONMENT=sandbox
```

#### ⚙️ Configurações Gerais
```env
PORT=3333
NODE_ENV=production
```

### 📋 CHECKLIST RENDER
- [ ] Acessar dashboard.render.com
- [ ] Localizar projeto backend
- [ ] Ir em Environment Variables
- [ ] Adicionar DATABASE_URL
- [ ] Adicionar JWT_SECRET
- [ ] Adicionar REFRESH_TOKEN_SECRET
- [ ] Adicionar EMAIL_USER
- [ ] Adicionar EMAIL_PASSWORD
- [ ] Adicionar EMAIL_HOST
- [ ] Adicionar EMAIL_PORT
- [ ] Adicionar PORT (3333)
- [ ] Adicionar NODE_ENV (production)
- [ ] Salvar configurações
- [ ] Aguardar redeploy automático

---

## 🌐 VERCEL (FRONTEND) - CONFIGURAÇÃO

### 📍 ACESSO
1. **Login**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. **Projeto**: Localizar `vet-system-frontend-blitz`
3. **Configurações**: Settings → Environment Variables

### 🔧 VARIÁVEIS OBRIGATÓRIAS

#### 🔗 API Connection
```env
VITE_API_URL=https://pulsevet-backend.render.com
```

#### 📱 App Information
```env
VITE_APP_NAME=PulseVet System
VITE_APP_VERSION=2.0.0
```

#### ⚙️ Environment
```env
VITE_NODE_ENV=production
```

### 📋 CHECKLIST VERCEL
- [ ] Acessar vercel.com/dashboard
- [ ] Localizar projeto frontend
- [ ] Ir em Settings → Environment Variables
- [ ] Adicionar VITE_API_URL
- [ ] Adicionar VITE_APP_NAME
- [ ] Adicionar VITE_APP_VERSION
- [ ] Adicionar VITE_NODE_ENV
- [ ] Salvar configurações
- [ ] Trigger redeploy manual

---

## 🔄 SEQUÊNCIA DE CONFIGURAÇÃO

### 1️⃣ PRIMEIRO: RENDER (Backend)
**Por quê primeiro?** O frontend precisa da URL do backend

1. Configure todas as variáveis do Render
2. Aguarde o redeploy automático (5-10 min)
3. Teste a URL: `https://pulsevet-backend.render.com`
4. Verifique se retorna: `{"message":"VetSystem API está funcionando!"}`

### 2️⃣ SEGUNDO: VERCEL (Frontend)
**Usar a URL real do backend**

1. Use a URL real do Render em `VITE_API_URL`
2. Configure outras variáveis
3. Trigger redeploy manual
4. Aguarde build (3-5 min)
5. Teste a aplicação completa

---

## 🧪 TESTES PÓS-CONFIGURAÇÃO

### 🔍 Backend (Render)
```bash
# Testar API básica
curl https://pulsevet-backend.render.com

# Testar endpoint de saúde
curl https://pulsevet-backend.render.com/health

# Testar autenticação
curl -X POST https://pulsevet-backend.render.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulsevet.com","password":"admin123"}'
```

### 🔍 Frontend (Vercel)
1. **Acessar**: `https://vet-system-frontend-blitz.vercel.app`
2. **Login**: `admin@pulsevet.com` / `admin123`
3. **Dashboard**: Verificar se carrega dados
4. **Funcionalidades**: Testar tutores, agenda, etc.

---

## 🚨 TROUBLESHOOTING

### ❌ Render: "Build Failed"
**Causa**: Variáveis mal configuradas  
**Solução**:
1. Verificar todas as variáveis
2. Especial atenção ao `DATABASE_URL`
3. Verificar se não há espaços extras
4. Trigger redeploy manual

### ❌ Vercel: "Build Failed"
**Causa**: `VITE_API_URL` incorreta  
**Solução**:
1. Verificar URL do Render
2. Testar URL manualmente
3. Verificar se não há `/` no final
4. Redeploy após correção

### ❌ Frontend: "Network Error"
**Causa**: CORS ou URL incorreta  
**Solução**:
1. Verificar `VITE_API_URL`
2. Testar backend diretamente
3. Verificar logs do Render
4. Verificar configuração CORS

### ❌ Backend: "Database Connection Error"
**Causa**: `DATABASE_URL` incorreta  
**Solução**:
1. Verificar URL do PostgreSQL
2. Testar conexão manualmente
3. Verificar se banco está ativo
4. Verificar credenciais

---

## 📧 CONFIGURAÇÃO DE EMAIL (GMAIL)

### 🔐 Senha de App Gmail
1. **Acessar**: [https://myaccount.google.com](https://myaccount.google.com)
2. **Segurança** → **Verificação em duas etapas**
3. **Senhas de app** → **Gerar nova senha**
4. **Usar** a senha gerada (16 caracteres)
5. **Não usar** a senha normal da conta

### ✅ Teste de Email
```bash
# Testar envio de email
curl -X POST https://pulsevet-backend.render.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"seu_email@gmail.com","subject":"Teste","text":"Funcionando!"}'
```

---

## 🎯 RESULTADO ESPERADO

### ✅ Sucesso Total
- **Backend**: `https://pulsevet-backend.render.com` funcionando
- **Frontend**: `https://vet-system-frontend-blitz.vercel.app` funcionando
- **Login**: `admin@pulsevet.com` / `admin123` funcional
- **Dashboard**: Carregando dados corretamente
- **Email**: Sistema de automação enviando lembretes

### 📊 Métricas de Sucesso
- **Response Time**: < 3 segundos
- **Uptime**: 100%
- **Funcionalidades**: Todas operacionais
- **Erros**: Zero erros críticos

---

## 📞 SUPORTE EMERGENCIAL

### 🆘 Se algo der muito errado:
1. **Reverter deploy** - Voltar versão anterior
2. **Verificar logs** - Render e Vercel dashboards
3. **Testar localmente** - Confirmar que funciona local
4. **Reconfigurar variáveis** - Verificar uma por uma
5. **Contatar suporte** - Render/Vercel se necessário

---

**🚀 PRÓXIMO PASSO**: Configurar variáveis no Render primeiro, depois Vercel!

**⏰ TEMPO TOTAL ESTIMADO**: 15-20 minutos para configuração completa