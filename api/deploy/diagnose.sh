#!/usr/bin/env bash
# Read-only: shows what is running on the server before anything is installed.
echo "== System";        . /etc/os-release; echo "$PRETTY_NAME"; uptime
echo "== Listening ports"; sudo ss -tlnp | sed 's/users:.*"\([^"]*\)".*/\1/'
echo "== Web servers";   for s in nginx apache2 caddy traefik; do systemctl is-active --quiet $s && echo "$s: active"; done
echo "== Docker";        command -v docker >/dev/null && sudo docker ps --format '{{.Names}}  {{.Image}}  {{.Ports}}' || echo "not installed"
echo "== Firewall (ufw)"; sudo ufw status 2>/dev/null || echo "ufw not installed"
echo "== SSH";           sudo sshd -T 2>/dev/null | grep -Ei '^(permitrootlogin|passwordauthentication|pubkeyauthentication) '
                         for h in /root /home/*; do [ -s "$h/.ssh/authorized_keys" ] && echo "keys: $h"; done
echo "== Updates";       dpkg -l unattended-upgrades 2>/dev/null | grep -q ^ii && echo "unattended-upgrades installed" || echo "unattended-upgrades missing"
echo "== fail2ban";      systemctl is-active fail2ban 2>/dev/null || echo "not installed"
