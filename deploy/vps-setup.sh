#!/usr/bin/env bash
# Preparação única da VPS (Ubuntu 24.04), executada como root.
# Instala Docker, firewall, atualizações automáticas e fail2ban; cria o usuário "deploy".
set -euo pipefail

DEPLOY_USER=deploy
PUBKEY="${1:?uso: vps-setup.sh '<chave publica ssh>'}"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get -y upgrade
apt-get install -y ca-certificates curl ufw fail2ban unattended-upgrades rsync

# Docker oficial
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Usuário de deploy com a chave informada
id "$DEPLOY_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$DEPLOY_USER"
usermod -aG docker "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
grep -qxF "$PUBKEY" "/home/$DEPLOY_USER/.ssh/authorized_keys" 2>/dev/null || echo "$PUBKEY" >> "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" /opt/eumaeus /opt/eumaeus-backups

# Firewall: só SSH, HTTP e HTTPS (Docker publica 80/443 diretamente)
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

# SSH somente por chave (a chave do deploy já está instalada acima)
# Drop-in com prefixo 00 para vencer o 50-cloud-init.conf (primeira ocorrência vale no sshd).
printf "PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin prohibit-password\n" \
  > /etc/ssh/sshd_config.d/00-eumaeus-hardening.conf
sshd -t
systemctl reload ssh || systemctl reload sshd

systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

# Backup diário do banco às 03:15
cat > /etc/cron.d/eumaeus-backup <<CRON
15 3 * * * $DEPLOY_USER /opt/eumaeus/deploy/backup.sh >> /opt/eumaeus-backups/backup.log 2>&1
CRON

echo "VPS pronta."
