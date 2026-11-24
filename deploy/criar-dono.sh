#!/usr/bin/env bash
# Cria a conta DONO inicial na produção. Rodar no SEU terminal (a senha é digitada por você).
# A senha vai pela entrada padrão do SSH: não aparece na tela, na linha de comando nem em logs.
# Uso: deploy/criar-dono.sh [host]   (padrão: 189.24.8.181)
set -euo pipefail
HOST="${1:-189.24.8.181}"
KEY="${EUMAEUS_SSH_KEY:-$HOME/.ssh/eumaeus_vps}"

echo "Criar a conta DONO do Eumaeus em $HOST"
read -r -p "Nome completo: " OWNER_NAME
read -r -p "E-mail de login: " OWNER_EMAIL
echo "Plano: 1) Clínica  2) Pet Shop  3) Clínica + Pet Shop"
read -r -p "Escolha [3]: " PLAN_CHOICE
case "${PLAN_CHOICE:-3}" in 1) OWNER_PLAN=CLINICA ;; 2) OWNER_PLAN=PETSHOP ;; 3) OWNER_PLAN=CLINICA_PETSHOP ;; *) echo "Plano inválido."; exit 1 ;; esac
echo "Senha: 16 a 72 caracteres, com maiúscula, minúscula, número e símbolo;"
echo "sem 'senha', 'admin', 'eumaeus', '***REMOVIDO***' nem o nome do e-mail."
read -r -s -p "Senha: " OWNER_PASSWORD; echo
read -r -s -p "Repita a senha: " OWNER_PASSWORD2; echo
if [[ "$OWNER_PASSWORD" != "$OWNER_PASSWORD2" ]]; then echo "As senhas não conferem."; exit 1; fi
unset OWNER_PASSWORD2

printf '%s\n%s\n%s\n%s\n' "$OWNER_NAME" "$OWNER_EMAIL" "$OWNER_PLAN" "$OWNER_PASSWORD" | ssh -i "$KEY" -o BatchMode=yes "deploy@$HOST" '
  set -eu
  IFS= read -r INITIAL_OWNER_NAME
  IFS= read -r INITIAL_OWNER_EMAIL
  IFS= read -r INITIAL_PLAN
  IFS= read -r INITIAL_OWNER_PASSWORD
  export INITIAL_OWNER_NAME INITIAL_OWNER_EMAIL INITIAL_OWNER_PASSWORD INITIAL_PLAN
  export PROVISION_FIRST_OWNER_CONFIRMATION=CREATE_INITIAL_OWNER
  docker exec -e INITIAL_OWNER_NAME -e INITIAL_OWNER_EMAIL -e INITIAL_OWNER_PASSWORD -e INITIAL_PLAN -e PROVISION_FIRST_OWNER_CONFIRMATION \
    eumaeus-api-1 node dist/src/commands/provisionFirstOwner.js
'
unset OWNER_PASSWORD
echo "Pronto. Entre em https://eumaeus.com.br/login com o e-mail informado."
