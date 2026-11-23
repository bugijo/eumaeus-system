# Deploy na VPS (Hostinger)

Stack única: PostgreSQL 16 + API (Express/Prisma) + Caddy (frontend estático, proxy `/api` e HTTPS automático).

## 1. Preparar a VPS (uma vez, como root)
```bash
scp deploy/vps-setup.sh root@<IP>:/root/
ssh root@<IP> "bash /root/vps-setup.sh '$(cat ~/.ssh/eumaeus_vps.pub)'"
```
Cria o usuário `deploy`, instala Docker, firewall (22/80/443), fail2ban, atualizações automáticas, desliga login SSH por senha e agenda o backup diário (03:15, retenção de 30 dias em `/opt/eumaeus-backups`).

## 2. Segredos (na VPS, nunca no git)
```bash
ssh -i ~/.ssh/eumaeus_vps deploy@<IP>
mkdir -p /opt/eumaeus/deploy && cd /opt/eumaeus/deploy
# preencher a partir de .env.example; segredos com: openssl rand -hex 32
nano .env && chmod 600 .env
```

## 3. DNS (registro.br)
- `A  eumaeus.com.br      → <IP>`
- `A  www.eumaeus.com.br  → <IP>`
O HTTPS só é emitido depois que o DNS aponta para a VPS.

## 4. Publicar
```bash
deploy/deploy.sh <IP>
```
Envia o commit atual (`git archive`), reconstrói e sobe. Migrations rodam automaticamente na subida da API.

## 5. Primeiro usuário dono (uma vez)
```bash
ssh -i ~/.ssh/eumaeus_vps deploy@<IP>
cd /opt/eumaeus && docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env exec \
  -e PROVISION_FIRST_OWNER_CONFIRMATION=CREATE_INITIAL_OWNER \
  -e INITIAL_OWNER_NAME='<nome>' -e INITIAL_OWNER_EMAIL='<email>' -e INITIAL_OWNER_PASSWORD='<senha forte>' \
  api npm run owner:provision
```

## Operação
- Logs: `docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env logs -f api`
- Backup manual: `deploy/backup.sh`
- Restaurar: `docker compose ... exec -T db pg_restore -U eumaeus -d eumaeus --clean < /opt/eumaeus-backups/<arquivo>.dump`
- Reverter versão: `git checkout <commit>` local e `deploy/deploy.sh <IP>`.

## Limites conhecidos
- Tudo em uma máquina: se a VPS cair, o sistema cai. Backups ficam no mesmo disco; copiar periodicamente para fora (ex.: Google Drive).
