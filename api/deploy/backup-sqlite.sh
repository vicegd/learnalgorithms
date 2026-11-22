#!/usr/bin/env bash
# Hot, consistent SQLite backup with integrity verification and 30-day retention.
# Schedule via cron on the VPS, e.g.:
#   0 3 * * * /opt/learnalgorithms/api/deploy/backup-sqlite.sh
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/learnalgorithms}"
CONTAINER_NAME="${CONTAINER_NAME:-api-api-1}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT_FILE="${BACKUP_DIR}/api-${STAMP}.sqlite3"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

# Use Python's built-in sqlite3 backup API inside the running container (safe while live)
docker exec "${CONTAINER_NAME}" python -c "
import sqlite3
src = sqlite3.connect('/data/api.sqlite3')
dst = sqlite3.connect('/tmp/backup.sqlite3')
src.backup(dst)
assert dst.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
dst.close()
src.close()
"

docker cp "${CONTAINER_NAME}:/tmp/backup.sqlite3" "${OUT_FILE}"
docker exec "${CONTAINER_NAME}" rm -f /tmp/backup.sqlite3
gzip -f "${OUT_FILE}"
chmod 600 "${OUT_FILE}.gz"

# Prune backups older than RETENTION_DAYS
find "${BACKUP_DIR}" -name 'api-*.sqlite3.gz' -type f -mtime +"${RETENTION_DAYS}" -delete
echo "Backup verified and saved: ${OUT_FILE}.gz"
