#!/usr/bin/env bash
set -euo pipefail

# Local-only launcher. It never selects a remote database and keeps the API
# origin explicit so VITE_API_URL is embedded consistently in the frontend.
API_PORT="${API_PORT:-3334}"
WEB_PORT="${WEB_PORT:-4174}"
DATABASE_URL="${DATABASE_URL:-postgresql://eumaeus:eumaeus_local_only@127.0.0.1:55432/eumaeus_local}"
export DATABASE_URL API_PORT WEB_PORT
export PORT="$API_PORT"
export HOST="127.0.0.1"
export NODE_ENV="development"
export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
export REFRESH_TOKEN_SECRET="${REFRESH_TOKEN_SECRET:-$(openssl rand -hex 32)}"

case "$DATABASE_URL" in
  *127.0.0.1:55432/eumaeus_local) ;;
  *) echo "Refusing non-local DATABASE_URL" >&2; exit 1 ;;
esac

npm --prefix backend run build
VITE_API_URL="http://127.0.0.1:${API_PORT}" npm run build
exec node backend/dist/src/bootstrap.js
