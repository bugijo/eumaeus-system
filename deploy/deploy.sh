#!/usr/bin/env bash
# Publica o commit atual (HEAD) na VPS. Uso: deploy/deploy.sh <ip-da-vps>
# Envia só arquivos versionados (git archive); o deploy/.env fica apenas na VPS.
set -euo pipefail
HOST="${1:?uso: deploy/deploy.sh <ip-da-vps>}"
KEY="${EUMAEUS_SSH_KEY:-$HOME/.ssh/eumaeus_vps}"
SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "deploy@$HOST")

cd "$(git rev-parse --show-toplevel)"
if [ -n "$(git status --porcelain)" ]; then
  echo "Há alterações não commitadas; commit antes de publicar." >&2
  exit 1
fi
REV=$(git rev-parse --short HEAD)
echo "Publicando $REV em $HOST..."

# Limpa a versão anterior (preservando deploy/.env) para que arquivos removidos do git não sobrem no servidor.
"${SSH[@]}" "mkdir -p /opt/eumaeus && cd /opt/eumaeus && find . -mindepth 1 -maxdepth 1 ! -name deploy -exec rm -rf {} + && { [ -d deploy ] && find deploy -mindepth 1 ! -name .env -exec rm -rf {} + || true; }"
git archive --format=tar HEAD | "${SSH[@]}" "tar -x -C /opt/eumaeus && echo $REV > /opt/eumaeus/REVISION"
"${SSH[@]}" "test -f /opt/eumaeus/deploy/.env || { echo 'Falta /opt/eumaeus/deploy/.env na VPS' >&2; exit 1; }"
"${SSH[@]}" "cd /opt/eumaeus && chmod +x deploy/*.sh && docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d --build --remove-orphans && docker image prune -f >/dev/null"
"${SSH[@]}" "cd /opt/eumaeus && docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env ps"
echo "Publicado $REV."
