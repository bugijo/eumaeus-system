#!/usr/bin/env bash
# Backup lógico diário do PostgreSQL da stack. Mantém 30 dias em /opt/eumaeus-backups.
set -euo pipefail
DIR=/opt/eumaeus-backups
KEEP_DAYS=30
STAMP=$(date +%Y%m%d-%H%M%S)
cd /opt/eumaeus
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env exec -T db \
  pg_dump -U eumaeus -d eumaeus --format=custom > "$DIR/eumaeus-$STAMP.dump.tmp"
mv "$DIR/eumaeus-$STAMP.dump.tmp" "$DIR/eumaeus-$STAMP.dump"
find "$DIR" -name 'eumaeus-*.dump' -mtime +"$KEEP_DAYS" -delete
echo "$(date -Is) backup ok: eumaeus-$STAMP.dump"
# Restaurar: docker compose ... exec -T db pg_restore -U eumaeus -d eumaeus --clean < arquivo.dump
