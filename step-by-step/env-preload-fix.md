# Fix: Pré-carregamento de variáveis de ambiente no backend

Arquivos alterados/criados:
- backend/load-env.js: carrega dotenv (require('dotenv').config())
- backend/package.json: script start usa `node -r ./dist/load-env.js dist/server.js`
- backend/tsconfig.json: inclui `load-env.js` na saída para `dist`

Motivação:
Garantir que as variáveis de ambiente sejam carregadas antes da inicialização do Prisma e do servidor Express em produção (build TS).

Passos para validar:
1. cd backend
2. npm run build
3. npm start
4. Verificar logs: DATABASE_URL deve estar disponível antes do boot.