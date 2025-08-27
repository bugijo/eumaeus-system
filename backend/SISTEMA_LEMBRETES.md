# 🤖 Sistema de Lembretes Automáticos - Eumaeus

## 🎯 Visão Geral

O Eumaeus agora é um sistema **PROATIVO**! Implementamos um módulo de marketing (CRM Básico) que envia lembretes automáticos por e-mail para:

- 📅 **Consultas agendadas** (lembrete no dia anterior)
- 💉 **Vacinas próximas do vencimento** (7 dias antes)

## 🏗️ Arquitetura do Sistema

### 📦 Componentes Principais

1. **EmailService.ts** - Responsável pelo envio de e-mails
2. **ReminderService.ts** - Lógica de busca e processamento de lembretes
3. **Cron Jobs** - Agendamento automático de tarefas

### ⏰ Agendamentos Configurados

| Horário | Frequência | Função | Descrição |
|---------|------------|--------|-----------|
| A cada minuto | Contínuo | Prova de Vida | Confirma que o sistema está ativo |
| 07:55 | Diário | Teste do Sistema | Verifica dados antes do envio |
| 08:00 | Diário | Envio de Lembretes | Envia e-mails automáticos |

## 🚀 Como Funciona

### 1. Lembretes de Consulta
- Busca agendamentos para o **dia seguinte**
- Filtra apenas consultas com status `SCHEDULED` ou `CONFIRMED`
- Envia e-mail personalizado para o tutor

### 2. Lembretes de Vacinação
- Busca vacinas que vencem nos **próximos 7 dias**
- Calcula vencimento baseado na última aplicação (1 ano de validade)
- Envia alerta para revacinação

## 📧 Configuração de E-mail

### Variáveis de Ambiente Necessárias

```env
# E-mail que enviará os lembretes
EMAIL_USER="seu-email@gmail.com"

# Senha de app do Gmail (NÃO use sua senha normal!)
EMAIL_PASSWORD="sua-senha-de-app-do-gmail"

# Configurações da clínica
CLINIC_NAME="Eumaeus Clínica Veterinária"
CLINIC_PHONE="(11) 99999-9999"
```

### 🔐 Como Configurar Gmail

1. **Ative a verificação em duas etapas** na sua conta Google
2. **Gere uma "Senha de App"** específica para esta aplicação
3. **Use a senha de app** no lugar da sua senha normal
4. **Configure as variáveis** no arquivo `.env`

## 🎨 Templates de E-mail

### 📅 Lembrete de Consulta
- Design responsivo e profissional
- Informações da consulta (pet, data, horário)
- Dicas úteis para o tutor
- Identidade visual do Eumaeus

### 💉 Lembrete de Vacinação
- Alerta visual destacado
- Detalhes da vacina vencendo
- Call-to-action para reagendamento
- Informações de contato da clínica

## 🧪 Testando o Sistema

### Verificação Manual
```bash
# No console do backend, você verá:
⏰ CRON JOB RODANDO! O sistema de automação está vivo. - [timestamp]
```

### Teste de Dados
```bash
# Às 7:55 diariamente, o sistema executa:
🧪 Executando teste do sistema de lembretes...
📋 Resultados do teste:
   - Agendamentos para amanhã: X
   - Vacinas próximas do vencimento: Y
```

### Envio Real
```bash
# Às 8:00 diariamente:
🌅 Iniciando envio de lembretes automáticos das 8:00...
📧 Iniciando envio de X lembretes de agendamento...
💉 Iniciando envio de Y lembretes de vacinação...
✅ Lembretes automáticos enviados com sucesso!
```

## 📊 Monitoramento

O sistema fornece logs detalhados:

- ✅ **Sucessos**: Quantidade de e-mails enviados
- ❌ **Falhas**: Erros e tentativas falhadas
- 📈 **Estatísticas**: Resumo diário de performance
- 🔍 **Debug**: Informações técnicas para troubleshooting

## 🛠️ Manutenção

### Alterando Horários
```typescript
// Em server.ts, modifique os cron schedules:
cron.schedule('0 8 * * *', async () => {
  // Formato: minuto hora dia mês dia-da-semana
  // 0 8 * * * = 8:00 todos os dias
});
```

### Customizando Templates
Edite os métodos em `EmailService.ts`:
- `sendAppointmentReminder()`
- `sendVaccineReminder()`

### Adicionando Novos Tipos de Lembrete
1. Crie nova função em `ReminderService.ts`
2. Adicione template em `EmailService.ts`
3. Configure novo cron job em `server.ts`

## 🎉 Benefícios

### Para a Clínica
- 📈 **Redução de faltas** em consultas
- 💰 **Aumento da receita** com revacinações
- ⚡ **Automação** de tarefas manuais
- 🎯 **Melhor relacionamento** com clientes

### Para os Tutores
- 🔔 **Lembretes úteis** e oportunos
- 📱 **Comunicação proativa** da clínica
- 🐾 **Cuidado preventivo** dos pets
- ✨ **Experiência premium** de atendimento

## 🚀 Próximos Passos

- [ ] Interface de configuração no frontend
- [ ] Personalização de templates via admin
- [ ] Relatórios de efetividade dos lembretes
- [ ] Integração com WhatsApp
- [ ] Lembretes de retorno pós-consulta
- [ ] Campanhas de marketing sazonais

---

**🎯 Missão Cumprida**: O Eumaeus evoluiu de um sistema reativo para um sistema **PROATIVO** que trabalha 24/7 para o sucesso da clínica!