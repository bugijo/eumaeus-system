# VetSystem Backend API

API backend para o sistema veterinário VetSystem, desenvolvida em Node.js com Express e TypeScript.

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Passos para executar:

1. **Navegue até a pasta do backend:**
   ```bash
   cd backend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute o servidor em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse a API:**
   - Servidor: http://localhost:3333
   - Endpoint de tutores: http://localhost:3333/api/tutors

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/     # Controladores das rotas
│   ├── models/          # Interfaces e tipos
│   ├── routes/          # Definição das rotas
│   ├── services/        # Lógica de negócio
│   └── server.ts        # Arquivo principal
├── package.json
├── tsconfig.json
└── .env
```

## 🛠️ Scripts Disponíveis

- `npm run dev` - Executa o servidor em modo de desenvolvimento
- `npm run build` - Compila o TypeScript para JavaScript
- `npm start` - Executa o servidor compilado

## 📋 Endpoints Disponíveis

### Autenticação
- `POST /api/auth/login` - Login de usuários
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout

### Tutores
- `GET /api/tutors` - Listar tutores
- `POST /api/tutors` - Criar tutor
- `GET /api/tutors/:id` - Buscar tutor por ID
- `PUT /api/tutors/:id` - Atualizar tutor
- `DELETE /api/tutors/:id` - Excluir tutor

### Pets
- `GET /api/pets` - Listar pets
- `POST /api/pets` - Criar pet
- `GET /api/pets/:id` - Buscar pet por ID
- `PUT /api/pets/:id` - Atualizar pet
- `DELETE /api/pets/:id` - Excluir pet

### Agendamentos
- `GET /api/appointments` - Listar agendamentos
- `POST /api/appointments` - Criar agendamento
- `GET /api/appointments/:id` - Buscar agendamento por ID
- `PUT /api/appointments/:id` - Atualizar agendamento
- `DELETE /api/appointments/:id` - Excluir agendamento
- `PATCH /api/appointments/:id/status` - Atualizar status

### Prontuários
- `GET /api/medical-records` - Listar prontuários
- `POST /api/medical-records` - Criar prontuário
- `GET /api/medical-records/:id` - Buscar prontuário por ID
- `PUT /api/medical-records/:id` - Atualizar prontuário

### Faturas
- `GET /api/invoices` - Listar faturas
- `POST /api/invoices/from-appointment/:appointmentId` - Criar fatura
- `GET /api/invoices/:id` - Buscar fatura por ID
- `PATCH /api/invoices/:id/status` - Atualizar status
- `GET /api/invoices/stats` - Estatísticas financeiras

### 📋 Módulo Fiscal - NFS-e
- `POST /api/invoices/:id/issue-nfe` - Emitir NFS-e
- `GET /api/invoices/:id/nfe-status` - Consultar status da NFS-e
- `GET /api/invoices/:id/nfe-pdf` - Baixar PDF da NFS-e
- `DELETE /api/invoices/:id/cancel-nfe` - Cancelar NFS-e

### Portal do Cliente
- `GET /api/portal/profile` - Perfil do tutor
- `PUT /api/portal/profile` - Atualizar perfil
- `GET /api/portal/pets` - Pets do tutor
- `GET /api/portal/appointments` - Agendamentos do tutor
- `POST /api/portal/appointments` - Agendar consulta
- `GET /api/portal/invoices` - Faturas do tutor

## 🏥 Módulo Fiscal

O sistema inclui um módulo completo para emissão de NFS-e (Nota Fiscal de Serviço Eletrônica) integrado com a **Focus NFe**.

### Configuração

1. **Variáveis de Ambiente:**
   ```env
   FOCUS_NFE_TOKEN="seu-token-aqui"
   NFE_ENVIRONMENT="sandbox"  # ou "production"
   EMPRESA_CNPJ="00.000.000/0001-00"
   EMPRESA_INSCRICAO_MUNICIPAL="123456"
   EMPRESA_CODIGO_MUNICIPIO="3543402"
   ```

2. **Fluxo de Emissão:**
   - Fatura deve estar com status `PAID`
   - Emissão via `POST /api/invoices/:id/issue-nfe`
   - Consulta de status via `GET /api/invoices/:id/nfe-status`
   - Download de PDF via `GET /api/invoices/:id/nfe-pdf`

### Características
- ✅ Integração com Focus NFe (1.200+ prefeituras)
- ✅ Ambiente sandbox para testes
- ✅ Emissão automática de descrição de serviços
- ✅ Códigos específicos para veterinárias (17.05)
- ✅ Tratamento de erros robusto
- ✅ Logs detalhados para auditoria

## 🔧 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Superset do JavaScript
- **Prisma** - ORM para banco de dados
- **SQLite** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **axios** - Cliente HTTP para APIs externas
- **CORS** - Middleware para permitir requisições cross-origin
- **dotenv** - Gerenciamento de variáveis de ambiente