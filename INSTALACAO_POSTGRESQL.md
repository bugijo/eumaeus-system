# 🐘 GUIA DE INSTALAÇÃO DO POSTGRESQL - WINDOWS

## 🚨 SITUAÇÃO ATUAL
**Status**: PostgreSQL não está instalado no sistema  
**Problema**: Comandos `psql` e `pg_dump` não reconhecidos  
**Necessário**: Instalar PostgreSQL com ferramentas de linha de comando  

---

## 📥 INSTALAÇÃO DO POSTGRESQL

### 🚀 OPÇÃO RÁPIDA: APENAS COMMAND LINE TOOLS
**Recomendado para backup/restore apenas**

1. Acesse: [https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
2. Baixe o instalador para Windows x86-64 (versão mais recente)
3. **Durante a instalação**: DESMARQUE tudo exceto "Command Line Tools"
4. Isso instala apenas `pg_dump`, `psql`, `pg_restore` etc.

### 1️⃣ DOWNLOAD OFICIAL COMPLETO
1. Acesse: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Clique em "Download the installer"
3. Escolha a versão mais recente (recomendado: PostgreSQL 15 ou 16)
4. Baixe o instalador para Windows x86-64

### 2️⃣ INSTALAÇÃO PASSO A PASSO

#### 🔧 Para Command Line Tools apenas:
1. **Execute o instalador** como administrador
2. **Diretório de instalação**: Mantenha o padrão (`C:\Program Files\PostgreSQL\16`)
3. **Componentes**: DESMARQUE tudo exceto:
   - ✅ Command Line Tools (ESSENCIAL)
4. **Instalar**: Aguarde a conclusão

#### 🔧 Para instalação completa:
1. **Execute o instalador** como administrador
2. **Diretório de instalação**: Mantenha o padrão (`C:\Program Files\PostgreSQL\16`)
3. **Componentes**: Marque TODOS os componentes:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (interface gráfica)
   - ✅ Stack Builder
   - ✅ Command Line Tools (ESSENCIAL)
4. **Diretório de dados**: Mantenha o padrão
5. **Senha do superusuário**: Defina uma senha forte (anote!)
6. **Porta**: Mantenha 5432 (padrão)
7. **Locale**: Mantenha o padrão
8. **Instalar**: Aguarde a conclusão

### 3️⃣ CONFIGURAÇÃO DO PATH
Após a instalação, adicione ao PATH do Windows:

1. **Abra as Variáveis de Ambiente**:
   - Pressione `Win + R`
   - Digite `sysdm.cpl`
   - Vá em "Avançado" > "Variáveis de Ambiente"

2. **Edite a variável PATH**:
   - Selecione "Path" em "Variáveis do sistema"
   - Clique em "Editar"
   - Clique em "Novo"
   - Adicione: `C:\Program Files\PostgreSQL\16\bin`
   - Clique em "OK" em todas as janelas

3. **Reinicie o PowerShell/Terminal**

---

## ✅ VERIFICAÇÃO DA INSTALAÇÃO

### 🧪 Teste os Comandos
Após a instalação, teste no terminal:

```powershell
# Verificar versão do PostgreSQL
psql --version

# Verificar pg_dump
pg_dump --version

# Verificar createdb
createdb --version

# Verificar pg_restore
pg_restore --version
```

### 📊 Resultado Esperado
```
psql (PostgreSQL) 16.x
pg_dump (PostgreSQL) 16.x
createdb (PostgreSQL) 16.x
pg_restore (PostgreSQL) 16.x
```

---

## 🔧 CONFIGURAÇÃO PARA O PROJETO

### 1️⃣ Criar Banco de Desenvolvimento
```powershell
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco para desenvolvimento
CREATE DATABASE Eumaeus_dev;

# Criar usuário para a aplicação
CREATE USER Eumaeus_user WITH PASSWORD 'senha_segura';

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE Eumaeus_dev TO Eumaeus_user;

# Sair
\q
```

### 2️⃣ Configurar Variável de Ambiente
Crie/edite o arquivo `.env` no backend:

```env
# Banco de desenvolvimento local
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Outras variáveis...
JWT_SECRET="seu_jwt_secret"
```

### 3️⃣ Testar Conexão
```powershell
# No diretório do backend
cd backend

# Testar conexão com Prisma
npx prisma db push

# Se funcionar, executar migrações
npx prisma migrate deploy
```

---

## 💾 BACKUP DO BANCO DE PRODUÇÃO (RENDER)

### 🎯 COMANDO PARA BACKUP IMEDIATO
Após instalar as Command Line Tools, execute:

```powershell
# Criar diretório para backups
mkdir "C:\Users\WINDOWS 10\Desktop\Backups"
cd "C:\Users\WINDOWS 10\Desktop\Backups"

# Executar backup do banco de produção
pg_dump "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public" > Eumaeus_backup_v1.sql
```

### 📋 VERIFICAÇÃO DO BACKUP
```powershell
# Verificar se o arquivo foi criado
ls Eumaeus_backup_v1.sql

# Ver tamanho do arquivo
Get-ChildItem Eumaeus_backup_v1.sql | Select-Object Name, Length

# Ver primeiras linhas do backup
Get-Content Eumaeus_backup_v1.sql -Head 10
```

### 🔄 RESTAURAR BACKUP (se necessário)
```powershell
# Para restaurar em banco local
psql -U Eumaeus_user -d Eumaeus_dev < Eumaeus_backup_v1.sql

# Para restaurar em outro banco de produção
psql "nova_database_url" < Eumaeus_backup_v1.sql
```

---

## 🚀 PREPARAÇÃO PARA PRODUÇÃO

### 🌐 Render PostgreSQL
Para produção no Render:

1. **Criar PostgreSQL Database** no Render
2. **Copiar a DATABASE_URL** fornecida
3. **Configurar no Render** como variável de ambiente
4. **Executar migrações** após deploy

### 📋 Comandos Úteis para Produção
```bash
# Backup do banco local
pg_dump -U Eumaeus_user -h localhost Eumaeus_dev > backup_local.sql

# Restaurar backup (se necessário)
psql -U Eumaeus_user -h localhost Eumaeus_dev < backup_local.sql

# Conectar ao banco do Render (exemplo)
psql $DATABASE_URL
```

---

## 🛠️ FERRAMENTAS ADICIONAIS

### 📊 pgAdmin 4 (Interface Gráfica)
- **Acesso**: Instalado automaticamente
- **URL**: `http://localhost:5050` (após iniciar)
- **Uso**: Gerenciar bancos visualmente

### 🔍 Extensões Úteis
```sql
-- Conectar ao banco e instalar extensões
psql -U postgres -d Eumaeus_dev

-- UUID (para IDs únicos)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Funções de texto
CREATE EXTENSION IF NOT EXISTS "unaccent";
```

---

## 🚨 TROUBLESHOOTING

### ❌ Problema: "psql não reconhecido"
**Solução**: PATH não configurado corretamente
1. Verifique se `C:\Program Files\PostgreSQL\16\bin` está no PATH
2. Reinicie o terminal
3. Teste novamente

### ❌ Problema: "Conexão recusada"
**Solução**: Serviço PostgreSQL não iniciado
1. Abra "Serviços" do Windows (`services.msc`)
2. Procure "postgresql-x64-16"
3. Clique em "Iniciar" se estiver parado

### ❌ Problema: "Senha incorreta"
**Solução**: Redefinir senha do postgres
1. Pare o serviço PostgreSQL
2. Inicie em modo single-user
3. Redefina a senha
4. Reinicie o serviço

---

## 📋 CHECKLIST DE INSTALAÇÃO

### ✅ Pré-Instalação
- [ ] Download do PostgreSQL oficial
- [ ] Executar como administrador
- [ ] Anotar senha do superusuário

### ✅ Durante a Instalação
- [ ] Todos os componentes selecionados
- [ ] Command Line Tools incluído
- [ ] Porta 5432 configurada
- [ ] Instalação concluída sem erros

### ✅ Pós-Instalação
- [ ] PATH configurado
- [ ] Terminal reiniciado
- [ ] Comandos testados (`psql --version`)
- [ ] Banco de desenvolvimento criado
- [ ] Conexão testada

### ✅ Configuração do Projeto
- [ ] `.env` atualizado com DATABASE_URL
- [ ] Prisma conectado
- [ ] Migrações executadas
- [ ] Dados de teste carregados

---

## 🎯 PRÓXIMOS PASSOS

1. **Instalar PostgreSQL** seguindo este guia
2. **Testar comandos** de linha de comando
3. **Configurar banco local** para desenvolvimento
4. **Atualizar .env** com nova DATABASE_URL
5. **Executar migrações** do Prisma
6. **Testar aplicação** localmente
7. **Preparar deploy** para produção

---

**🎉 Após a instalação, o sistema estará pronto para usar PostgreSQL tanto em desenvolvimento quanto em produção!**