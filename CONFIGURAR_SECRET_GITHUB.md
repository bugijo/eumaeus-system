# 🔐 Como Configurar o Secret VITE_API_URL no GitHub

## ⚠️ AÇÃO NECESSÁRIA - CONFIGURAÇÃO MANUAL

Para que o GitHub Actions funcione corretamente, você precisa configurar um **Secret** no seu repositório.

## 📋 Passo a Passo

### 1. Acesse seu Repositório no GitHub
- Vá para: https://github.com/bugijo/vet-system-frontend-blitz

### 2. Navegue até Settings
- Clique na aba **"Settings"** (no menu superior do repositório)

### 3. Acesse Secrets and Variables
- No menu lateral esquerdo, clique em **"Secrets and variables"**
- Depois clique em **"Actions"**

### 4. Criar Novo Secret
- Clique no botão **"New repository secret"**

### 5. Configurar o Secret
- **Name:** `VITE_API_URL`
- **Value:** `https://pulsevet-backend.onrender.com/api`
- Clique em **"Add secret"**

## ✅ Verificação

Após configurar o secret:

1. **Vá para a aba "Actions"** do seu repositório
2. **Você verá o workflow executando** automaticamente
3. **Aguarde a conclusão** (pode levar alguns minutos)
4. **Verifique se todos os testes passaram** ✅

## 🚀 O que Acontece Agora?

Com o secret configurado, **a cada push para o branch main**:

- ✅ O GitHub Actions será executado automaticamente
- ✅ Os testes Cypress rodarão no ambiente de CI
- ✅ Verificará se frontend e backend estão funcionando
- ✅ Em caso de falha, salvará screenshots e vídeos

## 🔍 Monitoramento

- **Actions Tab:** Veja execuções em tempo real
- **Badges:** Adicione badges de status ao README
- **Notificações:** Receba emails sobre falhas

---

**🎯 Missão:** Configure o secret e veja a mágica acontecer! Seu projeto agora tem CI/CD profissional.