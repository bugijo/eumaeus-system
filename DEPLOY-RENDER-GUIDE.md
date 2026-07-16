# DOCUMENTO LEGADO — NÃO USAR PARA PRODUÇÃO

Este guia contém região e planos antigos. O procedimento vigente está em
`docs/PRODUCTION_READINESS_RUNBOOK.md`. Nenhuma instrução abaixo autoriza
contratação, sincronização de Blueprint ou deploy.

# 🚀 Guia Completo de Deploy no Render - Eumaeus System

## ✅ Estágio 1: Checklist de Pré-Voo CONCLUÍDO

### ✅ Verificações Realizadas:
- [x] **Banco de Dados**: Provider alterado para `postgresql` no schema.prisma
- [x] **Variáveis de Ambiente**: Arquivo .env está no .gitignore ✅
- [x] **Scripts de Produção**: Scripts configurados no package.json:
  ```json
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js"
  }
  ```
- [x] **Dependências**: Prisma Client e Prisma CLI adicionados às dependências

---

## 🎯 Passo 2: Configuração no Render.com

### 📊 1. Criar o Banco de Dados PostgreSQL

1. Faça login no [Render.com](https://render.com)
2. No dashboard, clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `Eumaeus-db`
   - **Region**: `South America (São Paulo)`
   - **Plan**: `Free`
4. Clique em **"Create Database"**
5. ⏳ Aguarde alguns instantes para o banco ser criado

### 🔗 2. Copiar a URL do Banco

1. Na página do seu novo banco de dados
2. Vá para a seção **"Connections"**
3. Encontre a **"Internal Database URL"**
4. Clique em **"Copy"** e guarde essa URL
   - Formato: `postgresql://username:password@hostname:port/database`

### 🌐 3. Criar o Serviço Web (API)

1. Volte ao dashboard do Render
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório do GitHub
4. Selecione o repositório **Eumaeus System**
5. Configure:
   - **Name**: `Eumaeus-system-backend`
   - **Root Directory**: `backend` ⚠️ **MUITO IMPORTANTE**
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 🔐 4. Configurar Variáveis de Ambiente

Antes de finalizar, role para baixo até **"Environment"** e adicione:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Cole a URL copiada do banco PostgreSQL |
| `JWT_SECRET` | Gere uma senha longa e aleatória (ex: use um gerador online) |
| `REFRESH_TOKEN_SECRET` | Gere OUTRA senha diferente da anterior |
| `PORT` | `3333` |
| `FRONTEND_URL` | Deixe em branco por enquanto |

### 🚀 5. Deploy e Migração

1. Role até o final e clique em **"Create Web Service"**
2. ⏳ Aguarde o primeiro build (pode levar alguns minutos)
3. 🔴 **É normal falhar na primeira vez** (banco sem tabelas)
4. Quando o build terminar, vá para a aba **"Shell"**
5. Execute o comando para criar as tabelas:
   ```bash
   npx prisma migrate deploy
   ```
6. Após a migração, vá em **"Manual Deploy"**
7. Clique em **"Deploy latest commit"** para reiniciar

---

## 🎉 Resultado Esperado

Após o deploy bem-sucedido, sua API estará disponível em:
- `https://Eumaeus-system-backend.onrender.com/api/tutors`
- `https://Eumaeus-system-backend.onrender.com/api/pets`
- `https://Eumaeus-system-backend.onrender.com/api/appointments`
- `https://Eumaeus-system-backend.onrender.com/api/records`
- `https://Eumaeus-system-backend.onrender.com/api/products`
- `https://Eumaeus-system-backend.onrender.com/api/auth/login`
- `https://Eumaeus-system-backend.onrender.com/api/dashboard/stats`
- `https://Eumaeus-system-backend.onrender.com/api/invoices`

---

## 🔧 Troubleshooting

### ❌ Se o deploy falhar:
1. Verifique os logs na aba "Logs" do Render
2. Confirme que o Root Directory está como `backend`
3. Verifique se todas as variáveis de ambiente foram adicionadas

### ❌ Se a migração falhar:
1. Confirme que a DATABASE_URL está correta
2. Tente executar novamente: `npx prisma migrate deploy`
3. Se necessário, execute: `npx prisma db push`

---

## 📋 Próximos Passos

Após o backend estar funcionando:
1. ✅ Backend no Render (CONCLUÍDO)
2. 🔄 Frontend na Vercel (Próximo estágio)
3. 🔗 Conectar frontend ao backend
4. 🧪 Testes finais de integração

---

**🎯 Status**: Backend pronto para deploy no Render! 🟢
