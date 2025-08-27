# 💾 BACKUP DO BANCO DE PRODUÇÃO - RENDER

## 🚨 SITUAÇÃO ATUAL
**Status**: PostgreSQL Command Line Tools não instalados  
**Necessário**: Instalar pg_dump para fazer backup  
**Urgência**: ALTA - Backup antes de qualquer migração  

---

## ⚡ INSTALAÇÃO RÁPIDA - COMMAND LINE TOOLS

### 📥 DOWNLOAD E INSTALAÇÃO
1. **Acesse**: [https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
2. **Baixe**: PostgreSQL para Windows x86-64 (versão mais recente)
3. **Execute** o instalador como administrador
4. **IMPORTANTE**: Durante a instalação, DESMARQUE tudo exceto:
   - ✅ **Command Line Tools** (único item necessário)
5. **Instalar**: Aguarde a conclusão (5-10 minutos)

### 🔧 CONFIGURAR PATH
Após a instalação:
1. Pressione `Win + R` → digite `sysdm.cpl`
2. Vá em "Avançado" → "Variáveis de Ambiente"
3. Edite "Path" em "Variáveis do sistema"
4. Adicione: `C:\Program Files\PostgreSQL\16\bin`
5. **Reinicie o PowerShell/Terminal**

---

## 💾 EXECUTAR BACKUP

### 🎯 COMANDOS PARA BACKUP
```powershell
# 1. Criar diretório para backups
mkdir "C:\Users\WINDOWS 10\Desktop\Backups"
cd "C:\Users\WINDOWS 10\Desktop\Backups"

# 2. Executar backup do banco de produção
pg_dump "postgresql://Eumaeus_db_user:VJHnvnF2uwgLg3MwMdgEvdyae5zdxZ7P@dpg-d1jh806mcj7s739repog-a.ohio-postgres.render.com/Eumaeus_db" > Eumaeus_backup_v1.sql
```

### ✅ VERIFICAR BACKUP
```powershell
# Verificar se o arquivo foi criado
ls Eumaeus_backup_v1.sql

# Ver tamanho do arquivo (deve ter alguns KB/MB)
Get-ChildItem Eumaeus_backup_v1.sql | Select-Object Name, Length

# Ver primeiras linhas do backup
Get-Content Eumaeus_backup_v1.sql -Head 10
```

**Resultado esperado**: Arquivo `.sql` com comandos CREATE TABLE, INSERT, etc.

---

## 🔄 USAR O BACKUP

### 📤 RESTAURAR EM BANCO LOCAL
```powershell
# Conectar ao PostgreSQL local e restaurar
psql -U Eumaeus_user -d Eumaeus_dev < Eumaeus_backup_v1.sql
```

### 📤 RESTAURAR EM OUTRO BANCO DE PRODUÇÃO
```powershell
# Usar nova DATABASE_URL
psql "nova_database_url_aqui" < Eumaeus_backup_v1.sql
```

### 📊 ANALISAR DADOS DO BACKUP
```powershell
# Contar linhas do backup
(Get-Content Eumaeus_backup_v1.sql).Count

# Buscar por tabelas específicas
Select-String "CREATE TABLE" Eumaeus_backup_v1.sql

# Buscar por dados inseridos
Select-String "INSERT INTO" Eumaeus_backup_v1.sql
```

---

## 🚨 TROUBLESHOOTING

### ❌ Erro: "pg_dump não reconhecido"
**Causa**: PATH não configurado ou PostgreSQL não instalado  
**Solução**:
1. Verificar instalação: `Test-Path "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"`
2. Adicionar ao PATH conforme instruções acima
3. Reiniciar terminal

### ❌ Erro: "Connection refused"
**Causa**: URL de conexão incorreta ou banco indisponível  
**Solução**:
1. Verificar URL no Render Dashboard
2. Testar conectividade: `ping dpg-d1jh806mcj7s739repog-a.ohio-postgres.render.com`
3. Verificar se o banco está ativo no Render

### ❌ Erro: "Authentication failed"
**Causa**: Credenciais incorretas  
**Solução**:
1. Verificar usuário e senha no Render
2. Copiar URL completa novamente
3. Verificar se não há caracteres especiais mal escapados

---

## 📋 CHECKLIST DE BACKUP

### ✅ Pré-Backup
- [ ] PostgreSQL Command Line Tools instalado
- [ ] PATH configurado corretamente
- [ ] Terminal reiniciado
- [ ] Comando `pg_dump --version` funcionando
- [ ] Diretório de backup criado

### ✅ Durante o Backup
- [ ] URL de conexão copiada do Render
- [ ] Comando executado sem erros
- [ ] Arquivo `.sql` criado
- [ ] Tamanho do arquivo > 0 bytes

### ✅ Pós-Backup
- [ ] Backup verificado (primeiras linhas)
- [ ] Arquivo salvo em local seguro
- [ ] Backup testado (opcional)
- [ ] Data/hora do backup anotada

---

## 🎯 PRÓXIMOS PASSOS

1. **Instalar PostgreSQL Command Line Tools** (15-20 minutos)
2. **Configurar PATH** (5 minutos)
3. **Executar backup** (2-5 minutos)
4. **Verificar backup** (2 minutos)
5. **Prosseguir com migração V2.0**

---

## 📞 INFORMAÇÕES IMPORTANTES

**URL do Banco**: `postgresql://Eumaeus_db_user:VJHnvnF2uwgLg3MwMdgEvdyae5zdxZ7P@dpg-d1jh806mcj7s739repog-a.ohio-postgres.render.com/Eumaeus_db`

**Arquivo de Backup**: `Eumaeus_backup_v1.sql`

**Localização**: `C:\Users\WINDOWS 10\Desktop\Backups\`

**Comando Principal**:
```bash
pg_dump "postgresql://Eumaeus_db_user:VJHnvnF2uwgLg3MwMdgEvdyae5zdxZ7P@dpg-d1jh806mcj7s739repog-a.ohio-postgres.render.com/Eumaeus_db" > Eumaeus_backup_v1.sql
```

---

**🎉 Após seguir este guia, você terá um backup completo do banco de produção pronto para uso!**