# Estratégia Definitiva de Build e Start - Render

## Arquivos alterados:
- **backend/package.json**: Scripts reorganizados para separar responsabilidades
- **render.yaml**: Configuração definitiva com sintaxe multiline para startCommand

## Mudanças no package.json:
```json
"scripts": {
  "build": "tsc",
  "start": "node dist/server.js",
  "prisma:generate": "npx prisma generate"
}
```

## Configuração render.yaml definitiva:
- Uso de `fromDatabase` para DATABASE_URL
- `startCommand` com sintaxe multiline (`|`) para executar comandos em sequência
- Adição de `PRISMA_SKIP_POSTINSTALL_GENERATE=true`
- Separação clara entre build e start

## Estratégia:
1. **Build**: Apenas compilação TypeScript (`tsc`)
2. **Start**: Primeiro gera Prisma, depois inicia servidor
3. **Render**: Executa build, depois start com DATABASE_URL injetada

## Resultado esperado:
Resolve problemas de timing de variáveis de ambiente e garante que Prisma seja gerado com DATABASE_URL correta em produção.