# 🔧 Configuração de Portas - Eumaeus System

## 📋 Regra Fundamental

**NUNCA ALTERE AS PORTAS SEM AUTORIZAÇÃO EXPRESSA DO USUÁRIO**

### Portas Oficiais do Projeto:
- **Frontend (Vite)**: Porta `3000`
- **Backend (Express)**: Porta `3333`

## 📁 Arquivos de Configuração

### Frontend (Porta 3000)
- **Arquivo**: `vite.config.ts`
- **Configuração**:
```typescript
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000, // ⚠️ NUNCA ALTERAR
  },
  // ...
}));
```

### Backend (Porta 3333)
- **Arquivo**: `backend/src/server.ts`
- **Configuração**:
```typescript
const PORT = Number(process.env.PORT) || 3333; // ⚠️ NUNCA ALTERAR
```

### Configuração de API (Frontend)
- **Arquivo**: `src/config/env.ts`
- **Configuração**:
```typescript
const defaultConfig = {
  APP_URL: 'http://localhost:3000',    // ⚠️ NUNCA ALTERAR
  API_URL: 'http://localhost:3333',    // ⚠️ NUNCA ALTERAR
  // ...
};
```

- **Arquivo**: `src/api/apiClient.ts`
- **Configuração**:
```typescript
baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3333'}/api`,
```

## 🚨 Procedimento em Caso de Conflito de Porta

Se uma porta estiver ocupada:

1. **Primeiro**: Use o comando `kill` para liberar a porta
2. **Depois**: Tente iniciar o servidor novamente
3. **NUNCA**: Altere a porta de configuração

### Comandos para Liberar Portas (Windows):

```powershell
# Verificar o que está usando a porta 3000
netstat -ano | findstr :3000

# Verificar o que está usando a porta 3333
netstat -ano | findstr :3333

# Matar processo por PID (substitua XXXX pelo PID encontrado)
taskkill /PID XXXX /F
```

## 📝 Histórico de Configurações

- ✅ **vite.config.ts**: Porta 3000 configurada
- ✅ **backend/src/server.ts**: Porta 3333 configurada
- ✅ **src/config/env.ts**: URLs corretas configuradas
- ✅ **src/api/apiClient.ts**: API URL correta configurada
- ✅ **CORS**: Frontend (3000) autorizado no backend (3333)

## 🔒 Regras de Segurança

1. **Jamais altere as portas** sem autorização expressa
2. **Sempre documente** qualquer mudança autorizada
3. **Mantenha consistência** entre todos os arquivos de configuração
4. **Teste sempre** após qualquer alteração autorizada

---

**⚠️ ATENÇÃO**: Este arquivo serve como lembrete permanente das configurações de porta do projeto. Qualquer alteração deve ser discutida e aprovada antes da implementação.