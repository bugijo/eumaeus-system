# DOCUMENTO LEGADO — NÃO USAR PARA PRODUÇÃO

O fluxo abaixo menciona plano Free e migration manual e está obsoleto. Use
`docs/PRODUCTION_READINESS_RUNBOOK.md`. Nenhuma instrução deste arquivo autoriza
contratação, sincronização de Blueprint ou deploy.

# 🚀 Deploy do Backend no Render

## ✅ Checklist de Pré-Deploy Concluído

- [x] **Banco de Dados**: Provider alterado para `postgresql` no schema.prisma
- [x] **Variáveis de Ambiente**: Arquivo .env está no .gitignore
- [x] **Scripts de Produção**: Scripts `build` e `start` configurados no package.json
- [x] **Dependências**: Prisma Client e Prisma CLI adicionados às dependências

## 🔧 Configurações para o Render

### 1. Configurações do Web Service

```
Name: Eumaeus-system-backend
Root Directory: backend
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm start
Instance Type: Free
```

### 2. Variáveis de Ambiente Necessárias

```
DATABASE_URL=<URL_DO_BANCO_POSTGRESQL_DO_RENDER>
JWT_SECRET=<GERAR_NOVA_SENHA_LONGA_E_ALEATORIA>
REFRESH_TOKEN_SECRET=<GERAR_OUTRA_SENHA_DIFERENTE>
PORT=3333
FRONTEND_URL=<SERA_PREENCHIDO_DEPOIS_COM_URL_DA_VERCEL>
```

### 3. Comandos Pós-Deploy

Após o primeiro deploy, executar no Shell do Render:

```bash
npx prisma migrate deploy
```

### 4. Endpoints da API

Após o deploy, a API estará disponível em:
- `https://seu-app.onrender.com/api/tutors`
- `https://seu-app.onrender.com/api/pets`
- `https://seu-app.onrender.com/api/appointments`
- `https://seu-app.onrender.com/api/records`
- `https://seu-app.onrender.com/api/products`
- `https://seu-app.onrender.com/api/auth/login`
- `https://seu-app.onrender.com/api/dashboard/stats`
- `https://seu-app.onrender.com/api/invoices`

## 🎯 Próximos Passos

1. Criar banco PostgreSQL no Render
2. Configurar Web Service no Render
3. Adicionar variáveis de ambiente
4. Fazer primeiro deploy
5. Executar migração do banco
6. Testar endpoints da API
