# Encerramento forense dos bancos SQLite legados

Data da decisão: 16 de julho de 2026.

## Decisão

**DADOS SINTÉTICOS CONFIRMADOS — NÃO MIGRAR PARA PRODUÇÃO.**

O proprietário do sistema confirmou que o Eumaeus nunca foi utilizado pela
clínica, pela veterinária ou por funcionários com clientes reais. Confirmou
também que todos os cadastros antigos foram criados manualmente para testes e
posteriormente apagados durante o desenvolvimento.

Essa declaração encerra a incerteza conservadora registrada durante a inspeção
dos bancos SQLite, sem depender da exposição de qualquer campo pessoal.

## Classificação final

| Caminho histórico | Classificação |
| --- | --- |
| `backend/prisma/dev.db` | Sintético vazio |
| `prisma/dev.db` | Sintético confirmado pelo proprietário |
| `backend/prisma/prisma/dev.db` | Sintético confirmado pelo proprietário |

## Tratamento aprovado

- Preservar as cópias forenses atuais como evidências somente leitura.
- Não migrar nenhum registro antigo para PostgreSQL.
- Não restaurar nenhum dos bancos SQLite.
- Não usar esses arquivos como fonte de dados de produção.
- Não recolocar bancos SQLite na árvore atual do projeto.
- Não excluir as cópias preservadas sem uma decisão futura de retenção.
- Não reescrever o histórico Git para remover os blobs nesta fase.

## Consequência operacional

A produção deve começar com um PostgreSQL novo e vazio. As únicas gravações
anteriores à entrada em operação devem ser as migrations oficiais e a criação
manual, explícita e auditável da primeira conta com papel `DONO`.

Este documento não contém nomes, e-mails, telefones, endereços, textos
clínicos, credenciais, hashes ou tokens.
