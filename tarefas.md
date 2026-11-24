# Eumaeus — Tarefas para comercialização (atualizado em 23/11/2026, 2ª rodada)

Legenda: `[x]` feito e verificado · `[~]` existe, mas parcial ou não testado de ponta a ponta · `[ ]` a fazer

## 0. Infraestrutura
- [x] Pastas duplicadas removidas; um único repositório
- [x] Migrations corrigidas para banco novo; testes locais verdes
- [x] Stack de produção (Postgres + API + Caddy) em VPS Hostinger (189.24.8.181)
- [x] DNS do registro.br apontado para a VPS; HTTPS do Let's Encrypt emitido (validade até 21/02/2027, renovação automática)
- [x] Firewall, fail2ban, SSH só por chave e backup diário (03:15, 30 dias)
- [x] Ambiente local de testes (docker, porta 8088) com conta DONO de teste (credencial: ver cofre-claude/eumaeus-local-teste.env)
- [x] Criar o usuário DONO de produção (senha digitada pelo próprio dono; login confirmado)
- [ ] Remover o domínio do projeto antigo na Vercel e desligar os serviços do Render
- [ ] Push do branch para o GitHub e merge na main (precisa de autorização)
- [ ] Cópia dos backups para fora da VPS (ex.: Google Drive)
- [ ] Corrigir o drift do schema Prisma (nomes de índices e FKs)

## 1. Verificar se tudo funciona (smoke test na API local)
- [x] Login do DONO
- [x] Dashboard, tutores, pets, agendamentos, produtos, faturas, serviços, especialistas, receitas e pacotes: as listagens respondem 200
- [x] Cadastro de tutor e de pet
- [x] Centros de resultado (Clínica e Pet Shop) criados
- [x] PDF do contador gerado (`/financial/accounting/pdf`, 15 KB, período e centros)
- [x] Despesa: campo "Justificativa (obrigatória)" e erro real do servidor na tela
- [x] Cadastro de produto: mensagem diz qual campo corrigir; fornecedor e validade agora opcionais
- [ ] Teste de ponta a ponta na interface (login no navegador, telas, impressão), com o Giovanni logado ou com permissão para usar a senha de teste
- [x] Fluxo completo do caixa testado de ponta a ponta (cadastro com EAN, venda, idempotência, estoque, cancelamento, rateio e PDF)
- [ ] Fluxo de serviços: agendamento → atendimento → fatura → recebimento → estorno

## 2. Clínica e Pet Shop separados
- [x] Já existe "centro de resultado" (Clínica / Pet Shop) em produtos, serviços, faturas e despesas
- [x] Rateio de despesa compartilhada: lança uma vez e divide por percentual (centavos fecham o total)
- [x] Regras de rateio salvas (ex.: Energia 25/75) e reaproveitadas todo mês
- [x] Centros CLINICA e PETSHOP, regras Aluguel 50/50, Energia 25/75 e Agua 50/50, e aluguel de R$ 3.000 lançado (energia e água pendentes de valor)
- [x] PDF do contador com resultado por unidade e despesas marcadas como "rateio"
- [x] Decisão: rateio é só para o caso Clínica+Pet do Giovanni; para clientes, um acesso por estabelecimento

## 3. Caixa / PDV e código de barras
- [x] Campo de código de barras (EAN) no produto, único por clínica (leitura pela câmera no cadastro)
- [x] Tela /caixa com carrinho, desconto, pagamento dividido, troco e cupom (impressora 80 mm/A4)
- [x] Leitor USB (atua como teclado): bipar adiciona ao carrinho; atalhos F2/F9
- [x] Leitor pela câmera (BarcodeDetector nativo; ZXing em iOS/Windows) — testar em aparelho real
- [x] Baixa automática de estoque na venda (FEFO por lote) e devolução no cancelamento
- [ ] Abertura/fechamento de caixa (sangria, suprimento, conferência)

## 4. Fiscal
- [~] NFS-e (serviços da clínica) via Focus NFe: código pronto, sem token configurado e não testado em homologação
- [ ] NFC-e (venda de produtos do Pet Shop): não existe; necessária para o PDV
- [ ] Impressão: DANFE/NFC-e em impressora térmica de 80 mm e A4
- [ ] Certificado digital A1 por empresa, CSC da NFC-e e regime tributário (definir com o contador)

## 5. Financeiro e contador
- [x] PDF de resumo contábil por período e centro
- [x] PDF inclui vendas, formas de pagamento, resultado por unidade e rateios
- [ ] Revisar o PDF com o contador
- [ ] Exportação também em planilha (CSV/XLSX)
- [x] Tendências falsas: só existem em componente morto (DashboardPage), não aparecem no sistema

## 6. Aparência e usabilidade
- [~] Revisão visual: login com painel de apresentação, menu em seções (Dia a dia / Atendimento / Gestão), início com saudação e ações rápidas; busca e sino falsos do topo removidos. Falta: telas internas (agenda, prontuário, estoque) e estados vazios
- [~] Mensagens de erro por campo: produto e despesas feitos; revisar demais telas
- [ ] Onboarding da primeira vez: dados da clínica, logo, centros e usuários
- [x] Título e metadados neutros ("Eumaeus — Gestão para clínicas veterinárias e pet shops")
- [x] Configurações sem dados fictícios: Estabelecimento (razão social, CNPJ/CPF, e-mail, horário), Equipe e acessos (criar, cargo, ativar/desativar, redefinir senha), Minha conta (trocar senha). API /api/users só para DONO; garante um DONO ativo; desativar derruba a sessão (c69056f, em produção)
- [~] Páginas de debug públicas removidas; falta limpar a raiz (test-*.cjs, relatórios .md antigos, node-lts.msi)

## 7. Web, computador e celular
- [x] Web: https://eumaeus.com.br
- [x] PWA: manifest, ícones e service worker mínimo; instalável pelo Chrome/Edge no computador e no Android, e "Adicionar à Tela de Início" no iPhone
- [ ] Aplicativo Android/iOS: empacotar com Capacitor (mesma conta, mesma API)
- [ ] Desktop: PWA instalável primeiro; Electron/Tauri só se precisar de impressora fiscal local

## 8. Para vender (SaaS)
- [ ] Multi-empresa real: cadastro de nova clínica (tenant) e isolamento verificado
- [ ] Planos e cobrança recorrente
- [ ] Termos de uso, política de privacidade e LGPD
- [ ] Página de vendas

---

# Histórico anterior (roadmap 2025, mantido como referência)

# Eumaeus System - Roadmap Estratégico de Desenvolvimento

## Legenda de Status
- ✅ **Concluído:** Tarefa finalizada e validada.
- ⏳ **Em Planejamento:** Próxima grande fase em discussão.
- 🔲 **A Fazer:** Tarefas futuras na fila.
- 🚀 **Visão Futura:** Ideias para o estado da arte.

---

## ✅ FASE 1: A BASE SÓLIDA (MVP V1.0)
*Status: 100% CONCLUÍDO E EM PRODUÇÃO.*
- [x] CRUDs Completos (Tutor, Pet, Estoque)
- [x] Gestão de Agendamentos com Status
- [x] Prontuário Eletrônico com integração de Estoque
- [x] Módulo Financeiro Básico (Faturamento)
- [x] Dashboard Dinâmico
- [x] Sistema de Autenticação e Permissões (RBAC)
- [x] Deploy e estabilização em ambiente de produção (Vercel + Render)

### 🎨 MELHORIAS RECENTES IMPLEMENTADAS (Janeiro 2025)
- [x] **Dashboard "Cockpit da Clínica"** - Transformação visual e funcional completa:
  - [x] Cabeçalho renovado com indicador de atualização em tempo real
  - [x] Cards de estatísticas com bordas coloridas, animações e indicadores de tendência
  - [x] Lista de agendamentos interativa com modal de ações (confirmar/finalizar/cancelar)
  - [x] Feed de atividades com ícones dinâmicos e categorização por cores
  - [x] Interface moderna com gradientes, transições suaves e UX aprimorada

---

## 🚀 FASE 2: V2.0 - MÓDULO FISCAL E DE CONFORMIDADE ✅
**Status:** ✅ CONCLUÍDA  
**Prioridade:** ALTA  
**Prazo:** 30 dias  
**Data de Conclusão:** 26/07/2025
**QA:** 100% dos testes passaram (6/6 aprovado)

- `✅` **2.1. Receituário Digital:**
  - `[x]` Criação de receitas médicas digitais.
  - `[x]` Geração de PDF com assinatura eletrônica.
  - `[x]` Histórico de receitas por pet.
  - `[x]` API completa implementada (CRUD).
  - `[x]` Validações e relacionamentos funcionais.
- `✅` **2.2. Emissão de NFS-e:**
  - `[x]` Integração com provedores de NFS-e (Focus NFe).
  - `[x]` Geração automática de notas fiscais.
  - `[x]` Controle de impostos e tributos.
  - `[x]` Estrutura completa para emissão e consulta.
- `✅` **2.3. Relatórios Fiscais:**
  - `[x]` Relatórios de faturamento mensal.
  - `[x]` Controle de receitas e despesas.
  - `[x]` Exportação para contabilidade.
  - `[x]` Sistema de faturas implementado.
- `✅` **2.4. Sistema de Lembretes Automáticos:**
  - `[x]` Lembretes de consultas por e-mail/SMS.
  - `[x]` Lembretes de vacinação.
  - `[x]` Configuração de templates personalizados.
  - `[x]` Cron jobs ativos e funcionais.
  - `[x]` Sistema de automação 24/7 operacional.
- `❌` **2.5. Portal do Cliente:** [REMOVIDO]
  - `[x]` ~~Autenticação Dual para Tutores~~ - REMOVIDO DO SISTEMA.
  - `[x]` ~~Visualização de histórico de pets~~ - REMOVIDO DO SISTEMA.
  - `[x]` ~~Gestão de Perfil do Tutor~~ - REMOVIDO DO SISTEMA.
  - Sistema simplificado para acesso exclusivo de funcionários.

---

## 🔲 FASE 3: A VANGUARDA (V3.0)
*Status: A FAZER.*
- `🔲` **3.1. Telemedicina Integrada:**
  - `[ ]` Plataforma de teleconsulta por vídeo dentro do sistema.
- `🚀` **3.2. Pulse AI (Co-Piloto Inteligente):**
  - `[ ]` IA para suporte a diagnóstico e análise de prontuários.
  - `[ ]` IA para gestão de estoque e previsão de demanda.
- `🔲` **3.3. Planos de Saúde para Pets:**
  - `[ ]` Módulo para gestão de planos e cobranças recorrentes.
- `🔲` **3.4. Business Intelligence (BI) Avançado:**
  - `[ ]` Dashboards com análises preditivas.

---

## 🔲 FASE 4: NÍVEL ENTERPRISE (V4.0)
*Status: A FAZER.*
- `🔲` **4.1. Módulo de Internação:**
  - `[ ]` Controle de leitos, planos de tratamento e faturamento de internação.
- `🔲` **4.2. Gestão de Equipe Avançada:**
  - `[ ]` Cálculo e controle de comissões.
  - `[ ]` Agenda separada para Banho e Tosa.
- `🔲` **4.3. Gestão Multi-Unidade:**
  - `[ ]` Suporte para clínicas com múltiplas filiais.
- `🔲` **4.4. Integrações Externas:**
  - `[ ]` Integração com laboratórios para recebimento de resultados de exames.

---

## 🎯 DECISÃO ESTRATÉGICA PARA V2.0 - REDEFINIDA

**Situação Atual:** V1.0 concluída e em produção. **NOVA DECISÃO:** Módulo Fiscal como prioridade da V2.0.

### 🏆 NOVA ESCOLHA: Módulo Fiscal e de Conformidade
**Justificativa:** Necessidade regulatória e operacional
- ✅ Atende exigências legais e fiscais
- ✅ Melhora controle financeiro e contábil
- ✅ Facilita gestão de receituários e documentos
- ✅ Prepara para crescimento e auditoria
- ❌ Portal do Cliente removido para simplificar arquitetura

**Próximo Passo:** Implementar geração de receituário digital com assinatura eletrônica.

---

## 📊 STATUS ATUAL DO DESENVOLVIMENTO (Janeiro 2025)

### ✅ V2.0 CONCLUÍDA E APROVADA (26/07/2025):
- **Dashboard "Cockpit da Clínica"** - Interface completamente renovada com interatividade avançada
- **Melhorias de UX/UI** - Animações, gradientes e feedback visual aprimorado
- **Remoção do Portal do Cliente** - Sistema simplificado para acesso exclusivo de funcionários
- **Limpeza de Arquitetura** - Remoção de código desnecessário e simplificação do sistema
- **Receituário Digital** - API completa implementada e testada
- **Sistema de Automação** - Cron jobs ativos e funcionais (lembretes automáticos)
- **Configurações da Clínica** - CRUD completo implementado
- **Sistema de Produtos** - Gestão de estoque implementada
- **NFS-e** - Estrutura completa preparada para Focus NFe
- **Migração de Dados** - Script migrate-v2.ts testado e validado
- **QA Completo** - 100% dos testes passaram (6/6 aprovado)
- **Documentação Completa** - Guias de deploy e configuração finalizados

### ✅ DEPLOY FINALIZADO:
- **Git Push** - Realizado com sucesso (677 objetos)
- **Build Automático** - Vercel e Render processados
- **Configuração de Produção** - Variáveis de ambiente configuradas
- **Sistema Operacional** - V2.0 100% funcional em produção

### 🎯 PRÓXIMA FASE - V3.0 (Planejamento):
1. **Portal do Cliente** - Implementação futura
2. **Telemedicina** - Consultas online
3. **Gestão Multi-Unidade** - Suporte a filiais
4. **Integrações Externas** - Laboratórios e parceiros

**Progresso Geral V2.0:** ✅ 100% CONCLUÍDO E EM PRODUÇÃO

---

## 🏆 CONQUISTAS DA V2.0

### 📊 Estatísticas de Desenvolvimento:
- **Linhas de Código:** +2.500 linhas adicionadas
- **Novos Endpoints:** 15+ APIs implementadas
- **Modelos de Dados:** 8 novos modelos (Prescription, Invoice, Product, etc.)
- **Testes de QA:** 100% aprovação (6/6 testes passaram)
- **Documentação:** 10+ arquivos de documentação criados

### 🚀 Funcionalidades Implementadas:
- ✅ **Receituário Digital** - Sistema completo de prescrições médicas
- ✅ **NFS-e** - Integração com Focus NFe para emissão de notas fiscais
- ✅ **Sistema de Automação** - Lembretes automáticos 24/7
- ✅ **Gestão de Produtos** - Controle de estoque e medicamentos
- ✅ **Configurações da Clínica** - Personalização completa do sistema
- ✅ **Migração Segura** - Transição V1.0 → V2.0 sem perda de dados

### 🎯 Impacto no Negócio:
- **Automação:** Redução de 80% no tempo de criação de receitas
- **Compliance:** 100% adequação às normas fiscais veterinárias
- **Eficiência:** Lembretes automáticos reduzem faltas em consultas
- **Escalabilidade:** Base sólida para crescimento futuro

**Status Final:** 🎉 V2.0 APROVADA E EM PRODUÇÃO COM SUCESSO!
## 7. Venda, downloads e lojas (rodada 23/11/2026)
- [x] Página de venda em `/` para visitantes (recursos, como começar, botão Entrar); quem já entrou continua vendo o painel
- [x] Seção "Aplicativos" na landing e um bloco recolhível "Baixar aplicativo" na tela de login
- [x] Downloads só mostram o que já funciona (navegador e instalação pelo navegador). Os demais aparecem como "Em breve", sem link quebrado
- [ ] Preços e planos da página de venda: aguardando definição sua (não inventei valores)
- [ ] Contato comercial na página de venda: aguardando o e-mail ou WhatsApp público que você quer usar
- [ ] Depoimentos e prints reais: a prévia da página usa exemplos genéricos
- [ ] Instalador Windows (.exe), macOS (.dmg) e Linux (AppImage): empacotar com Electron ou Tauri, com build em CI (macOS exige máquina Mac ou runner no GitHub)
- [ ] APK Android: empacotar com Capacitor e publicar o arquivo na própria página
- [ ] iPhone/iPad: exige conta Apple Developer. Sem ela não há distribuição pública fora da App Store
- [ ] Publicação na Google Play e na App Store

### Custos (fontes oficiais consultadas em 23/11/2026)
| Item | Custo | Observação |
|---|---|---|
| Apple Developer Program | US$ 99 por ano | Necessário para App Store, TestFlight e assinatura/notarização do macOS. Fonte: developer.apple.com |
| Google Play Console | US$ 25 uma vez | Registro único. Fonte: support.google.com/googleplay |
| Apple Developer Enterprise | US$ 299 por ano | Não serve para venda pública; não recomendado |
| Certificado de assinatura de código Windows | Estimativa: valor anual variável | Sem ele o Windows mostra alerta do SmartScreen. Cotar antes de comprar |
| Hospedagem dos APK e instaladores | Sem custo adicional previsto | Ficam no próprio servidor, junto com o site |

### Decisões que dependem de você
- Confirmar que a Apple Developer (US$ 99/ano) e a Google Play (US$ 25) podem ser contratadas no nome do responsável legal.
- Aprovar o gasto com certificado Windows, depois de ver a cotação.
- Escolher: publicar iOS só pela App Store (recomendado) ou manter só o atalho do Safari por enquanto.

## 7. Planos e acessos (commit 2da0862, falta publicar)
- [x] Planos Clínica / Pet Shop / Clínica + Pet Shop, com contas separadas ou juntas
- [x] Dono escolhe o que cada funcionário acessa; cargo Banho e tosa
- [x] Catálogo inicial de medicamentos, vacinas e materiais no cadastro de produto
- [x] Landing com telas reais e seção de planos
- [ ] Aprovar os preços dos planos (proposta: R$ 99 / 149 / 199)
- [ ] Canal de contato comercial para quem ainda não é cliente
- [ ] Veterinária revisar o catálogo de medicamentos (apresentações e concentrações)
- [ ] Contratação/troca de plano pelo próprio cliente (hoje o plano é definido em deploy/criar-dono.sh)
