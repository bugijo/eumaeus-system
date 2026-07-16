# Simulação de 30 dias

## Objetivo

Gerar dados descartáveis para testes locais de perfis, agenda, atendimentos, vacinas e faturamento.

Estes scripts recusam produção, exigem `NODE_ENV=development` ou `test` e só executam após opt-in explícito. Use exclusivamente um PostgreSQL local e descartável.

## Seed direto no banco local

No diretório `backend`, defina uma senha efêmera com pelo menos 12 caracteres sem incluí-la no comando versionado ou no histórico do shell:

```bash
export NODE_ENV=development
export ALLOW_TEST_DATA_MUTATION=true
export SIM_DEFAULT_PASSWORD='<senha-efêmera-local>'
npm run simulate:30d
```

`SIM_DAYS` pode alterar a quantidade de dias simulados. O valor da senha nunca é exibido pelos scripts.

## Simulação pela API local

`npm run simulate:real` também aceita apenas um `SIM_BASE_URL` em `localhost` e exige credenciais explícitas para os quatro perfis:

- `SIM_ADMIN_EMAIL` e `SIM_ADMIN_PASSWORD`;
- `SIM_VET_EMAIL` e `SIM_VET_PASSWORD`;
- `SIM_RECEPCAO_EMAIL` e `SIM_RECEPCAO_PASSWORD`;
- `SIM_AUXILIAR_EMAIL` e `SIM_AUXILIAR_PASSWORD`.

O script não possui endpoint, usuário ou senha padrão e não pode apontar para o Render.
