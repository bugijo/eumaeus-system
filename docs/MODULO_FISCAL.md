# 📋 Módulo Fiscal - NFS-e

## Visão Geral

O Módulo Fiscal do Eumaeus permite a emissão de Notas Fiscais de Serviço Eletrônica (NFS-e) diretamente a partir das faturas geradas no sistema. Esta funcionalidade traz conformidade fiscal e profissionalismo para clínicas veterinárias.

## 🎯 Estratégia Técnica

### O Desafio da NFS-e no Brasil

No Brasil, não existe um padrão nacional para NFS-e. Cada município possui:
- Seu próprio sistema
- Seu próprio layout de dados (XML)
- Sua própria API

Isso significa que uma integração que funciona em Ribeirão Preto-SP não funcionaria em São Paulo-SP.

### Nossa Solução

Utilizamos a **Focus NFe** como intermediário:
- ✅ Mais de 1.200 prefeituras integradas
- ✅ API REST padronizada
- ✅ Documentação clara
- ✅ Ambiente de sandbox para testes
- ✅ Preços competitivos

## 🚀 Configuração

### 1. Conta na Focus NFe

1. Acesse [Focus NFe](https://focusnfe.com.br)
2. Crie uma conta
3. Obtenha seu token de API
4. Configure o ambiente (sandbox/produção)

### 2. Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

```env
# Focus NFe Configuration
FOCUS_NFE_TOKEN="seu-token-aqui"
NFE_ENVIRONMENT="sandbox"  # ou "production"

# Dados da Empresa
EMPRESA_CNPJ="00.000.000/0001-00"
EMPRESA_INSCRICAO_MUNICIPAL="123456"
EMPRESA_CODIGO_MUNICIPIO="3543402"  # Código IBGE do município
```

### 3. Certificado Digital

Para produção, você precisará:
- Certificado digital A1 (eCNPJ ou eCPF)
- Configurar na Focus NFe

## 📡 API Endpoints

### Emitir NFS-e
```http
POST /api/invoices/:id/issue-nfe
```

**Pré-requisitos:**
- Fatura deve estar com status `PAID`
- Fatura não pode já ter uma NFS-e emitida

**Resposta:**
```json
{
  "message": "NFS-e emitida com sucesso",
  "data": {
    "nfseId": "INVOICE_123_1642781234567",
    "status": "processando",
    "numero": null,
    "linkPdf": null,
    "linkXml": null
  }
}
```

### Consultar Status da NFS-e
```http
GET /api/invoices/:id/nfe-status
```

**Resposta:**
```json
{
  "data": {
    "id": "INVOICE_123_1642781234567",
    "status": "autorizada",
    "numero": "000000123",
    "dataEmissao": "2024-01-23T10:30:00Z",
    "valorTotal": 150.00,
    "linkPdf": "https://focusnfe.com.br/pdf/...",
    "linkXml": "https://focusnfe.com.br/xml/..."
  }
}
```

### Baixar PDF da NFS-e
```http
GET /api/invoices/:id/nfe-pdf
```

Retorna o arquivo PDF da NFS-e.

### Cancelar NFS-e
```http
DELETE /api/invoices/:id/cancel-nfe
Content-Type: application/json

{
  "motivo": "Erro na emissão - dados incorretos do cliente"
}
```

## 🔄 Fluxo de Trabalho

### 1. Atendimento Completo
- Agendamento realizado
- Prontuário preenchido
- Status: `COMPLETED`

### 2. Geração da Fatura
- Fatura criada automaticamente
- Inclui serviços e produtos utilizados
- Status inicial: `PENDING`

### 3. Pagamento
- Fatura marcada como `PAID`
- Agora pode emitir NFS-e

### 4. Emissão da NFS-e
- Clique em "Emitir NFS-e" na fatura
- Sistema envia dados para Focus NFe
- Status inicial: `processando`

### 5. Processamento
- Focus NFe comunica com a prefeitura
- Status atualizado para `autorizada` ou `rejeitada`
- PDF e XML disponíveis para download

## 📊 Status da NFS-e

| Status | Descrição |
|--------|----------|
| `processando` | NFS-e enviada, aguardando processamento |
| `autorizada` | NFS-e autorizada pela prefeitura |
| `rejeitada` | NFS-e rejeitada (verificar motivo) |
| `cancelada` | NFS-e cancelada |

## 🏥 Dados Específicos para Veterinárias

### Código de Serviço
- **Item Lista de Serviço:** 17.05
- **Descrição:** Serviços de medicina veterinária
- **Código Tributário:** 1705

### Alíquota de ISS
- **Padrão:** 5% (pode variar por município)
- **ISS Retido:** Não (padrão para veterinárias)

### Descrição dos Serviços
O sistema gera automaticamente uma descrição detalhada:

```
Serviços veterinários:
- Consulta Padrão: R$ 80,00
- Vacina V10: R$ 45,00

Produtos utilizados:
- Seringa 3ml (2x): R$ 4,00
- Algodão (1x): R$ 2,00

Total: R$ 131,00
```

## 🛠️ Desenvolvimento

### Estrutura do Código

```
backend/src/
├── services/
│   └── nfe.service.ts          # Integração com Focus NFe
├── controllers/
│   └── invoice.controller.ts   # Endpoints de NFS-e
└── routes/
    └── invoice.routes.ts       # Rotas de NFS-e
```

### Principais Classes

#### `NFeService`
- `emitirNFSe()` - Emite uma nova NFS-e
- `consultarNFSe()` - Consulta status
- `cancelarNFSe()` - Cancela NFS-e
- `baixarPdf()` - Download do PDF
- `baixarXml()` - Download do XML

#### `InvoiceController`
- `issueNFSe()` - Endpoint para emissão
- `getNFSeStatus()` - Endpoint para consulta
- `downloadNFSePdf()` - Endpoint para PDF
- `cancelNFSe()` - Endpoint para cancelamento

## 🧪 Testes

### Ambiente Sandbox

A Focus NFe oferece um ambiente de testes:
- Não gera NFS-e real
- Simula todo o fluxo
- Ideal para desenvolvimento

### Dados de Teste

```env
NFE_ENVIRONMENT="sandbox"
FOCUS_NFE_TOKEN="seu-token-de-teste"
EMPRESA_CNPJ="07.504.505/0001-132"  # CNPJ de teste
```

## 🚨 Considerações de Produção

### Segurança
- ✅ Tokens em variáveis de ambiente
- ✅ Validação de dados antes do envio
- ✅ Logs detalhados para auditoria
- ✅ Tratamento de erros robusto

### Performance
- ✅ Timeout de 30 segundos para APIs
- ✅ Retry automático em caso de falha
- ✅ Cache de consultas frequentes

### Monitoramento
- ✅ Logs estruturados
- ✅ Métricas de sucesso/falha
- ✅ Alertas para erros críticos

## 📞 Suporte

### Focus NFe
- **Site:** https://focusnfe.com.br
- **Documentação:** https://focusnfe.com.br/doc/
- **Suporte:** suporte@focusnfe.com.br

### Códigos de Município
- **IBGE:** https://www.ibge.gov.br/explica/codigos-dos-municipios.php
- **Ribeirão Preto-SP:** 3543402
- **São Paulo-SP:** 3550308

## 🔮 Roadmap

### V2.1 - Melhorias
- [ ] Interface visual para emissão de NFS-e
- [ ] Relatórios fiscais
- [ ] Integração com contabilidade

### V2.2 - Automação
- [ ] Emissão automática após pagamento
- [ ] Envio por email para clientes
- [ ] Backup automático de XMLs

### V2.3 - Compliance
- [ ] Integração com SPED
- [ ] Relatórios para contabilidade
- [ ] Dashboard fiscal

---

**Desenvolvido com ❤️ para clínicas veterinárias brasileiras**