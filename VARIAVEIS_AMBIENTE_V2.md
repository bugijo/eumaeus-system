# 🔧 VARIÁVEIS DE AMBIENTE - V2.0

## 📋 RESUMO
Este documento lista todas as variáveis de ambiente necessárias para o funcionamento completo da V2.0 do Eumaeus System.

---

## 🖥️ BACKEND (Render)

### 🗄️ Banco de Dados
```env
# URL de conexão com PostgreSQL (Render fornece automaticamente)
DATABASE_URL=postgresql://username:password@host:port/database
```

### 🔐 Autenticação JWT
```env
# Chave secreta para assinatura dos tokens JWT
# CRÍTICO: Deve ser uma string longa e aleatória
JWT_SECRET=seu_jwt_secret_super_seguro_de_pelo_menos_32_caracteres
```

### 📧 Sistema de Email (Automação)
```env
# Configurações do Gmail para envio de lembretes
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app_do_gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 💰 Focus NFe (NFS-e)
```env
# Token da API Focus NFe (opcional)
FOCUS_NFE_TOKEN=seu_token_focus_nfe
FOCUS_NFE_ENVIRONMENT=sandbox  # ou 'production'
```

### ⚙️ Configurações Gerais
```env
# Porta do servidor (Render usa automaticamente)
PORT=3333

# Ambiente de execução
NODE_ENV=production
```

---

## 🌐 FRONTEND (Vercel)

### 🔗 API
```env
# URL do backend em produção
VITE_API_URL=https://seu-backend.onrender.com
```

### 📱 Aplicação
```env
# Nome da aplicação
VITE_APP_NAME=Eumaeus System

# Versão da aplicação
VITE_APP_VERSION=2.0.0
```

### 🛠️ Configurações
```env
# Ambiente de execução
VITE_NODE_ENV=production
```

---

## 📝 INSTRUÇÕES DE CONFIGURAÇÃO

### 🔧 Render (Backend)
1. Acesse o dashboard do Render
2. Vá em "Environment Variables"
3. Adicione cada variável listada acima
4. **IMPORTANTE:** Use "Secret" para variáveis sensíveis (JWT_SECRET, EMAIL_PASSWORD, FOCUS_NFE_TOKEN)

### ⚡ Vercel (Frontend)
1. Acesse o dashboard da Vercel
2. Vá em "Settings" > "Environment Variables"
3. Adicione as variáveis do frontend
4. Certifique-se de que `VITE_API_URL` aponta para o URL correto do Render

---

## 🚨 VARIÁVEIS CRÍTICAS

### ⚠️ Obrigatórias para Funcionamento Básico
- `DATABASE_URL` - Conexão com banco
- `JWT_SECRET` - Autenticação
- `VITE_API_URL` - Comunicação frontend/backend

### 📧 Necessárias para Sistema de Automação
- `EMAIL_USER` - Conta de email
- `EMAIL_PASSWORD` - Senha de app do Gmail
- `EMAIL_HOST` - Servidor SMTP
- `EMAIL_PORT` - Porta SMTP

### 💰 Opcionais (NFS-e)
- `FOCUS_NFE_TOKEN` - Token da API
- `FOCUS_NFE_ENVIRONMENT` - Ambiente (sandbox/production)

---

## 🔒 SEGURANÇA

### ✅ Boas Práticas
1. **JWT_SECRET**: Use pelo menos 32 caracteres aleatórios
2. **EMAIL_PASSWORD**: Use senha de app do Gmail, não a senha principal
3. **FOCUS_NFE_TOKEN**: Mantenha em ambiente sandbox até testes completos
4. **DATABASE_URL**: Nunca exponha em logs ou código

### 🚫 Nunca Faça
- Não commite variáveis de ambiente no código
- Não use senhas fracas ou previsíveis
- Não exponha tokens em logs
- Não use ambiente de produção para testes

---

## 🧪 AMBIENTE DE DESENVOLVIMENTO

### 📁 Arquivo .env (Backend)
```env
# Banco local SQLite
DATABASE_URL="file:./dev.db"

# JWT para desenvolvimento
JWT_SECRET="<generate-a-random-development-secret>"

# Email de teste (opcional)
EMAIL_USER=""
EMAIL_PASSWORD=""
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"

# Focus NFe em sandbox
FOCUS_NFE_TOKEN=""
FOCUS_NFE_ENVIRONMENT="sandbox"

# Configurações locais
PORT="3333"
NODE_ENV="development"
```

### 📁 Arquivo .env (Frontend)
```env
# API local
VITE_API_URL="http://localhost:3333"

# Configurações de desenvolvimento
VITE_APP_NAME="Eumaeus System (Dev)"
VITE_APP_VERSION="2.0.0-dev"
VITE_NODE_ENV="development"
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### 🔧 Antes do Deploy
- [ ] Todas as variáveis obrigatórias configuradas
- [ ] JWT_SECRET gerado com segurança
- [ ] Email de produção configurado
- [ ] URLs de produção corretas
- [ ] Tokens de API válidos

### 🚀 Após o Deploy
- [ ] Backend conecta com banco
- [ ] Frontend conecta com backend
- [ ] Sistema de email funcional
- [ ] Autenticação operacional
- [ ] NFS-e em ambiente correto

---

## 📞 SUPORTE

### 🆘 Em Caso de Problemas
1. **Render**: Verificar logs do backend
2. **Vercel**: Verificar build logs
3. **Email**: Testar configurações SMTP
4. **Focus NFe**: Verificar status da API

### 🔗 Links Úteis
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Focus NFe API](https://focusnfe.com.br/doc/)

---

**🎯 OBJETIVO:** Garantir que todas as variáveis estejam configuradas corretamente para um deploy seguro e funcional da V2.0.**
