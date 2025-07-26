📜 Diretrizes de Automação e Comunicação

🔧 REGRA FUNDAMENTAL DE PORTAS:
- Frontend (Vite): SEMPRE porta 3000
- Backend (Express): SEMPRE porta 3333
- NUNCA altere essas portas sem autorização expressa do usuário
- Documentação completa: CONFIGURACAO_PORTAS.md

Procedimento em caso de conflito:
1. Use comando kill para liberar a porta ocupada
2. Tente iniciar o servidor novamente
3. JAMAIS altere a configuração de porta

Arquivos com configuração de porta:
- vite.config.ts (porta 3000)
- backend/src/server.ts (porta 3333)
- src/config/env.ts (URLs das portas)
- src/api/apiClient.ts (URL da API)

📋 Outras Regras:
- Sempre finaliza deixando os dois servidores (backend e frontend) rodando
- Use somente as portas 3000 e 3333
- Sempre que for iniciar um servidor em uma porta, se não conseguir usar a porta de escolha, use primeiro o comando kill para parar tudo o que está rodando na porta e depois tente novamente
