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

### Tutores
- `GET /api/tutors` - Lista todos os tutores (dados mock)

## 🔧 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Superset do JavaScript
- **CORS** - Middleware para permitir requisições cross-origin
- **dotenv** - Gerenciamento de variáveis de ambiente