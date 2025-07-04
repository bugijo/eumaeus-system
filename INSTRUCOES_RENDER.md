# 🚨 AÇÃO NECESSÁRIA: Configurar External Database URL do Render

## Passos para obter a External Database URL:

1. **Acesse o painel do Render**: https://dashboard.render.com
2. **Vá para seu banco de dados PostgreSQL**
3. **Na aba "Info"**, copie a **External Database URL**
4. **Substitua no arquivo `.env`** a linha:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```
   
   Pela External Database URL que você copiou, exemplo:
   ```
   DATABASE_URL="postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com/database_name"
   ```

5. **Configurar acesso IP (se necessário)**:
   - Vá na aba "Access" do seu banco no Render
   - Adicione seu IP atual à lista de IPs permitidos
   - O Render geralmente sugere automaticamente seu IP

## ⚠️ IMPORTANTE:
- Após fazer o push das novas migrações, **VOLTE** a DATABASE_URL para SQLite local:
  ```
  DATABASE_URL="file:./dev.db"
  ```
- Isso evita afetar o banco de produção durante o desenvolvimento

## Próximos passos após configurar:
1. Execute: `npx prisma migrate dev --name init-postgres`
2. Faça commit e push das novas migrações
3. Reverta o .env para SQLite local

---
**Este arquivo será deletado após o processo ser concluído.**