# Teste do Módulo Fiscal - NFS-e

## Visão Geral
Este documento descreve como testar o módulo fiscal de NFS-e implementado no sistema.

## Pré-requisitos

### 1. Configuração do Backend
Certifique-se de que as seguintes variáveis estão configuradas no `.env` do backend:

```env
# Configurações da Focus NFe
FOCUS_NFE_TOKEN=seu_token_aqui
FOCUS_NFE_ENVIRONMENT=homologacao  # ou 'producao'
FOCUS_NFE_CNPJ=12345678000123
FOCUS_NFE_INSCRICAO_MUNICIPAL=123456
FOCUS_NFE_CODIGO_MUNICIPIO=3550308  # São Paulo
```

### 2. Conta na Focus NFe
- Crie uma conta em https://focusnfe.com.br/
- Obtenha o token de API
- Configure o ambiente de homologação

## Fluxo de Teste

### Passo 1: Criar uma Fatura
1. Acesse o sistema
2. Crie um agendamento
3. Gere uma fatura a partir do agendamento
4. Marque a fatura como "Paga"

### Passo 2: Acessar Detalhes da Fatura
1. Navegue para a página de detalhes da fatura
2. Localize a seção "Nota Fiscal de Serviço (NFS-e)"
3. Verifique se o status mostra "Não emitida"

### Passo 3: Emitir NFS-e
1. Clique no botão "Emitir NFS-e"
2. Aguarde o processamento
3. Verifique se o status muda para "Processando" ou "Emitida com Sucesso"

### Passo 4: Testar Funcionalidades

#### Download do PDF
1. Quando a NFS-e estiver emitida, clique em "Baixar PDF"
2. Verifique se o arquivo é baixado corretamente

#### Consulta de Status
1. A página atualiza automaticamente o status
2. Verifique se as informações como número da nota e código de verificação aparecem

#### Cancelamento
1. Clique em "Cancelar NFS-e"
2. Digite uma justificativa
3. Confirme o cancelamento
4. Verifique se o status muda para "Cancelada"

## Endpoints de API

### Emitir NFS-e
```http
POST /api/invoices/:id/issue-nfe
```

### Consultar Status
```http
GET /api/invoices/:id/nfe-status
```

### Baixar PDF
```http
GET /api/invoices/:id/nfe-pdf
```

### Cancelar NFS-e
```http
POST /api/invoices/:id/cancel-nfe
Content-Type: application/json

{
  "justificativa": "Motivo do cancelamento"
}
```

## Códigos de Status da Focus NFe

- **100**: Emitida com Sucesso
- **200**: Cancelada
- **202**: Processando
- **Outros**: Erro ou status específico

## Troubleshooting

### Erro: "Focus NFe não configurado"
- Verifique se o token está configurado no `.env`
- Reinicie o backend após configurar

### Erro: "Fatura deve estar paga"
- Certifique-se de que o status da fatura é "PAID"

### Erro de Validação
- Verifique se todos os dados obrigatórios estão preenchidos
- CNPJ, Inscrição Municipal, etc.

### Timeout na API
- A Focus NFe pode demorar para processar
- Aguarde alguns minutos e consulte o status novamente

## Dados de Teste

Para ambiente de homologação, você pode usar:

```
CNPJ: 07504505000132 (CNPJ de teste da Focus NFe)
Inscrição Municipal: 123456
Código do Município: 3550308 (São Paulo)
```

## Interface do Usuário

A interface foi projetada para ser intuitiva:

1. **Status Visual**: Badges coloridos indicam o estado da NFS-e
2. **Ações Contextuais**: Botões aparecem conforme o estado
3. **Feedback Imediato**: Toasts informam sobre sucesso/erro
4. **Validações**: Campos obrigatórios são validados

## Considerações de Produção

1. **Certificado Digital**: Necessário para ambiente de produção
2. **Backup**: Mantenha backup dos XMLs das notas
3. **Logs**: Monitore logs para detectar problemas
4. **Rate Limiting**: Respeite os limites da API da Focus NFe

## Próximos Passos

1. Implementar relatórios fiscais
2. Adicionar validações específicas por município
3. Integrar com outros provedores de NFS-e
4. Implementar assinatura digital própria

---

**Nota**: Este módulo está em conformidade com a legislação brasileira de NFS-e e utiliza a Focus NFe como provedor homologado.