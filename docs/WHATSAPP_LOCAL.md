# WhatsApp local/simulado

Esta frente fornece somente um contrato local para desenvolvimento e testes. Ela não importa SDK de WhatsApp, não abre conexão externa e não envia mensagens reais.

## Configuração

Defina `WHATSAPP_MODE=simulation` (ou deixe o valor ausente) e forneça `WHATSAPP_WEBHOOK_SECRET` por variável de ambiente local. O segredo deve ter pelo menos 32 caracteres e não pode ser um placeholder. Ele nunca deve ser gravado em código, fixtures versionadas, logs ou documentação.

`loadWhatsAppLocalConfig` rejeita qualquer modo diferente de `simulation` e valida o segredo antes de construir o adapter. A rota local usa `WHATSAPP_LOCAL_CHANNELS_JSON`, um objeto privado no ambiente que associa cada `channelId` a `clinicId`, `verifyToken` e segredo HMAC próprio. O `clinicId` não é aceito no corpo do webhook.

## Contrato

`SimulatedWhatsAppProvider` implementa `WhatsAppProvider` e mantém o estado em memória:

- `send` aceita um `eventId` e retorna `accepted`;
- `markDelivered` registra a entrega simulada;
- `markFailed` registra falha e justificativa;
- repetir o mesmo `eventId` retorna o primeiro resultado e não cria uma segunda entrega.

`SimulatedWhatsAppWebhookReceiver` exige assinatura HMAC-SHA256 no formato `sha256=<hex>`, compara em tempo constante e rejeita payloads inválidos. Eventos com o mesmo `id` são aceitos apenas uma vez.

## Rota local de contrato

`createWhatsAppWebhookRouter` expõe `GET /:channelId` para o handshake `hub.mode=subscribe`, `hub.verify_token` e `hub.challenge`, e `POST /:channelId` para o corpo bruto assinado por `X-Hub-Signature-256`. O router deve ser montado antes de `express.json()`:

```ts
app.use('/api/webhooks/whatsapp', createWhatsAppWebhookRouter({ channels, store: whatsappPrismaStore }));
app.use(express.json());
```

O store Prisma grava o evento inbound como uma linha `CommunicationOutbox` em estado `RECEIVED`, com chave durável `whatsapp:inbound:<channelId>:<eventId>`, associada ao tutor localizado pelo telefone dentro da clínica configurada. Eventos já gravados retornam `duplicate=true`; portanto a deduplicação sobrevive a reinício. O estado inbound é append-only: eventos repetidos ou fora de ordem não sobrescrevem uma linha anterior.

## Limites

O adapter simulado continua em memória. A rota persistente não foi montada no bootstrap nesta frente: a ordem atual aplica `express.json()` global antes das rotas, o que destruiria a garantia de assinatura sobre os bytes originais. A montagem segura requer uma alteração coordenada do bootstrap, fora do escopo delimitado desta entrega. Não existe modelo dedicado de evento inbound ou estado agregado de entrega; usar `CommunicationOutbox` é uma persistência mínima e não substitui uma migration futura para histórico inbound completo. Não há transporte externo.

## Verificação

Execute no backend:

```bash
npm test -- --runInBand src/__tests__/whatsapp.local.test.ts
npm test -- --runInBand src/__tests__/whatsappWebhook.routes.test.ts
npm run build
```

Os testes cobrem configuração segura, assinatura, deduplicação e os estados `accepted`, `delivered` e `failed` sem tráfego externo.
