# WhatsApp local/simulado

Esta frente fornece somente um contrato local para desenvolvimento e testes. Ela não importa SDK de WhatsApp, não abre conexão externa e não envia mensagens reais.

## Configuração

Defina `WHATSAPP_MODE=simulation` (ou deixe o valor ausente) e forneça `WHATSAPP_WEBHOOK_SECRET` por variável de ambiente local. O segredo deve ter pelo menos 32 caracteres e não pode ser um placeholder. Ele nunca deve ser gravado em código, fixtures versionadas, logs ou documentação.

`loadWhatsAppLocalConfig` rejeita qualquer modo diferente de `simulation` e valida o segredo antes de construir o adapter.

## Contrato

`SimulatedWhatsAppProvider` implementa `WhatsAppProvider` e mantém o estado em memória:

- `send` aceita um `eventId` e retorna `accepted`;
- `markDelivered` registra a entrega simulada;
- `markFailed` registra falha e justificativa;
- repetir o mesmo `eventId` retorna o primeiro resultado e não cria uma segunda entrega.

`SimulatedWhatsAppWebhookReceiver` exige assinatura HMAC-SHA256 no formato `sha256=<hex>`, compara em tempo constante e rejeita payloads inválidos. Eventos com o mesmo `id` são aceitos apenas uma vez.

## Limites

O deduplicador é em memória e serve apenas para testes locais. Persistência, expiração, retentativas de produção, credenciais de provedor e integração com outbox devem ser desenhadas separadamente. Esta frente não altera `communication.service.ts`, migrations, telas ou o bootstrap do servidor.

## Verificação

Execute no backend:

```bash
npm test -- --runInBand src/__tests__/whatsapp.local.test.ts
npm run build
```

Os testes cobrem configuração segura, assinatura, deduplicação e os estados `accepted`, `delivered` e `failed` sem tráfego externo.
