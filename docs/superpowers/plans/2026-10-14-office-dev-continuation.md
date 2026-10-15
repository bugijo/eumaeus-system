# Escritório Dev Local — Continuação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** fechar as falhas backend individualizadas e produzir evidência local das jornadas de contador, assistente, pacotes, receitas, assistência e cirurgia.

**Architecture:** corrigir fixtures apenas nos testes que deixam identidades/mocks ausentes; preservar o middleware de autenticação e seus testes negativos. Validar jornadas através do backend local, UI local e artefatos sintéticos, sem dados remotos ou efeitos externos.

**Tech Stack:** TypeScript, Jest, Vitest, Express, Prisma/PostgreSQL local, React/Vite, browser local.

**Spec:** solicitação de continuidade do Escritório Dev nesta conversa.

## Global Constraints

- Preservar worktrees, commits, dados e o HEAD coordenador; não usar `origin/main` como base.
- Usar somente PostgreSQL local `eumaeus_local` e dados sintéticos.
- Não desativar middleware, ampliar permissões, pular testes ou trocar expectativas sem causa comprovada.
- Nenhuma mensagem real, produção, Hermes, deploy, gasto, emissão fiscal ou publicação remota.

## Review Focus

- Usuário sintético deve existir, estar ativo, possuir papel e pertencer à clínica do token; testes de usuário ausente continuam 401.
- Mock de tutor deve devolver lista, contagem, criação e P2002 de modo determinístico.
- Exportações contábil/CSV/PDF/compartilhamento devem usar o mesmo período e payload.
- Lembretes devem conservar origem, adiamento, dispensa, reativação e resolução após reload.
- Operações de pacote, receita, assistência e cirurgia devem demonstrar persistência e permissões negativas.

### Task 1: Fixtures de autenticação e tutores

**Files:** `backend/src/__tests__/medicalRecord.routes.integration.test.ts`, `backend/src/__tests__/tutors.test.ts`

- [x] Definir identidades sintéticas por arquivo com `id`, `clinicId`, `roleName` e `active` coerentes com o token.
- [x] Definir mocks determinísticos de tutor, incluindo conflito `P2002` na segunda criação do mesmo email.
- [x] Executar os dois arquivos afetados e confirmar os testes negativos de autenticação separadamente.
- [x] Executar a suíte backend completa e persistir relatório em `/tmp/eumaeus-backend-office-continuation.json`.

### Task 2: Jornadas locais

**Files:** documentação de evidência e apenas código de produto se houver defeito reproduzido.

- [x] Subir frontend/backend localmente com PostgreSQL local e validar contador/assistente por UI.
- [x] Inspecionar CSV/PDF e revisar compartilhamento simulado sem envio; a interface prepara e enfileira a simulação inline.
- [ ] Validar pacotes, receitas, assistência e cirurgia com reload e permissões negativas.
- [ ] Registrar cada requisito como implementação, automação, banco, visual ou dependência externa.

### Task 3: Verificação final

- [x] Rodar build/testes relevantes novamente após mudanças; o Vitest amplo mantém 12 falhas não relacionadas já existentes e o conjunto direcionado fecha em 13/13 arquivos, 22/22 testes.
- [ ] Revisar diff, status, worktrees e ausência de processos locais restantes.
- [ ] Commitar somente mudanças comprovadas e atualizar a matriz de evidências.
