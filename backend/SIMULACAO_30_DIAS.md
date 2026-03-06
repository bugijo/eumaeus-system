# Simulacao de 30 dias

## Objetivo
Gerar um ambiente de demonstracao com:
- 1 admin
- 1 veterinario
- 1 recepcao
- 1 auxiliar
- dados operacionais de 30 dias (cadastros, agenda, atendimentos, vacinas e faturamento)

## Perfis e acesso (RBAC)
- `DONO` (admin): acesso total
- `VETERINARIO`: acesso total clinico e financeiro
- `RECEPCAO` (e perfil legado `FUNCIONARIO`): agenda e cadastros, sem financeiro
- `AUXILIAR`: acesso limitado; nao pode criar/editar prontuario
- `FINANCEIRO`: acesso financeiro

## Comando
No backend:

```bash
npm run simulate:30d
```

Opcional:

```bash
SIM_DAYS=30 SIM_DEFAULT_PASSWORD=123456 npm run simulate:30d
```

## Logins criados (senha padrao `123456`)
- `admin@eumaeus.com` (`DONO`)
- `veterinario@eumaeus.com` (`VETERINARIO`)
- `recepcao@eumaeus.com` (`RECEPCAO`)
- `auxiliar@eumaeus.com` (`AUXILIAR`)
- `financeiro@eumaeus.com` (`FINANCEIRO`)
