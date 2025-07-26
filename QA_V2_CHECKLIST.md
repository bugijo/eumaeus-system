# 🧪 QA V2.0 - Checklist de Testes Completo

## 📋 Status Geral
- ✅ Frontend rodando em http://localhost:3000
- ✅ Backend rodando em http://localhost:3333
- ✅ Sistema de automação ativo (cron jobs funcionando)
- ✅ Banco de dados local funcionando

---

## 🩺 1. RECEITUÁRIO - Testes Completos

### 1.1 Fluxo Básico
- [ ] **Acesso ao Receituário**: Navegar para um pet e acessar o prontuário
- [ ] **Criação de Receita**: Criar nova receita com dados completos
- [ ] **Salvamento**: Verificar se os dados são salvos corretamente no backend
- [ ] **Carregamento**: Recarregar a página e verificar se os dados persistem
- [ ] **Edição**: Editar uma receita existente
- [ ] **Exclusão**: Deletar uma receita

### 1.2 Geração de PDF
- [ ] **PDF Básico**: Gerar PDF com dados mínimos
- [ ] **PDF Completo**: Gerar PDF com todos os campos preenchidos
- [ ] **Formatação**: Verificar layout, fontes e espaçamento
- [ ] **Dados Corretos**: Confirmar que todos os dados aparecem corretamente
- [ ] **Download**: Testar download do PDF
- [ ] **Impressão**: Testar função de impressão

### 1.3 Validações
- [ ] **Campos Obrigatórios**: Testar validação de campos obrigatórios
- [ ] **Formatos**: Testar validação de formatos (datas, números)
- [ ] **Limites**: Testar limites de caracteres
- [ ] **Medicamentos**: Adicionar/remover múltiplos medicamentos

---

## 🧾 2. NFS-E - Testes de Integração

### 2.1 Configuração
- [ ] **Token Focus NFe**: Verificar se está configurado (ambiente de teste)
- [ ] **Variáveis de Ambiente**: Confirmar FOCUS_NFE_TOKEN no backend
- [ ] **Endpoint**: Testar conectividade com API da Focus NFe

### 2.2 Fluxo Completo
- [ ] **Emissão**: Emitir NFS-e com dados de teste
- [ ] **Status**: Consultar status da nota emitida
- [ ] **PDF**: Baixar PDF da nota fiscal
- [ ] **Cancelamento**: Cancelar uma nota (se permitido em homologação)
- [ ] **Histórico**: Verificar histórico de notas emitidas

### 2.3 Tratamento de Erros
- [ ] **Dados Inválidos**: Testar com dados inválidos
- [ ] **Timeout**: Testar comportamento em caso de timeout
- [ ] **Erro de API**: Simular erro da API externa
- [ ] **Mensagens**: Verificar se mensagens de erro são claras

---

## 🤖 3. PAINEL DE AUTOMAÇÃO - Testes Funcionais

### 3.1 Interface
- [ ] **Acesso**: Navegar para Configurações > Notificações
- [ ] **Layout**: Verificar responsividade em diferentes tamanhos
- [ ] **Status**: Confirmar indicadores de sistema ativo
- [ ] **Switches**: Testar todos os switches (habilitar/desabilitar)

### 3.2 Configurações
- [ ] **Templates**: Editar templates de e-mail
- [ ] **Variáveis**: Verificar se variáveis são exibidas corretamente
- [ ] **Horários**: Alterar horário de envio
- [ ] **Dados da Clínica**: Atualizar informações da clínica
- [ ] **Salvamento**: Salvar configurações e verificar persistência

### 3.3 Funcionalidades Avançadas
- [ ] **Testar E-mail**: Usar função "Testar E-mail" (configurar EMAIL_USER/PASSWORD)
- [ ] **Reset**: Testar função "Resetar Padrão"
- [ ] **Validações**: Testar validações de formato (horário, e-mail)
- [ ] **Estados de Loading**: Verificar indicadores de carregamento

### 3.4 Backend/Cron Jobs
- [ ] **Cron Ativo**: Confirmar que cron jobs estão rodando
- [ ] **Logs**: Verificar logs do sistema de automação
- [ ] **Configuração**: Testar se mudanças são aplicadas sem reiniciar
- [ ] **Performance**: Verificar se não há vazamentos de memória

---

## 🔄 4. INTEGRAÇÃO GERAL

### 4.1 Fluxos Combinados
- [ ] **Pet → Prontuário → Receita**: Fluxo completo
- [ ] **Consulta → Fatura → NFS-e**: Fluxo fiscal completo
- [ ] **Agendamento → Lembrete**: Testar sistema de lembretes
- [ ] **Múltiplos Usuários**: Testar com diferentes perfis

### 4.2 Performance
- [ ] **Carregamento**: Tempos de resposta aceitáveis
- [ ] **Memória**: Uso de memória estável
- [ ] **Concurrent Users**: Simular múltiplos usuários
- [ ] **Banco de Dados**: Verificar queries eficientes

### 4.3 Segurança
- [ ] **Autenticação**: Testar login/logout
- [ ] **Autorização**: Verificar permissões por perfil
- [ ] **Tokens**: Testar renovação de tokens
- [ ] **Dados Sensíveis**: Verificar se não há exposição

---

## 🐛 5. TESTES DE EDGE CASES

### 5.1 Cenários Extremos
- [ ] **Dados Muito Longos**: Testar com textos muito grandes
- [ ] **Caracteres Especiais**: Testar com acentos, símbolos
- [ ] **Conexão Lenta**: Simular conexão lenta
- [ ] **Offline**: Testar comportamento offline

### 5.2 Recuperação de Erros
- [ ] **Refresh**: Testar F5 em diferentes telas
- [ ] **Navegação**: Testar botão voltar do navegador
- [ ] **Sessão Expirada**: Testar comportamento com token expirado
- [ ] **Servidor Down**: Testar com backend desligado

---

## 📱 6. RESPONSIVIDADE

- [ ] **Desktop**: Testar em resolução 1920x1080
- [ ] **Tablet**: Testar em resolução 768x1024
- [ ] **Mobile**: Testar em resolução 375x667
- [ ] **Navegadores**: Chrome, Firefox, Edge

---

## ✅ 7. CRITÉRIOS DE APROVAÇÃO

### Para Aprovar a V2.0:
- [ ] **95%+ dos testes** devem passar
- [ ] **Zero bugs críticos** (que impedem uso)
- [ ] **Máximo 3 bugs menores** (melhorias de UX)
- [ ] **Performance aceitável** (< 3s para operações principais)
- [ ] **Documentação atualizada**

---

## 📝 REGISTRO DE BUGS ENCONTRADOS

### 🔴 Críticos
*(Impedem o uso da funcionalidade)*

### 🟡 Menores
*(Melhorias de UX/UI)*

### 🟢 Sugestões
*(Melhorias futuras)*

---

## 📊 RESUMO FINAL

**Data do Teste**: ___________
**Testador**: ___________
**Versão**: V2.0

**Resultados**:
- Total de Testes: ___/___
- Taxa de Sucesso: ___%
- Bugs Críticos: ___
- Bugs Menores: ___
- Status: [ ] ✅ APROVADO [ ] ❌ REPROVADO [ ] 🔄 REQUER CORREÇÕES

**Próximos Passos**:
- [ ] Correção de bugs encontrados
- [ ] Reteste das correções
- [ ] Preparação para migração de dados
- [ ] Deploy em produção