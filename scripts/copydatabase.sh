d=$1

echo "Backing up db with timestamp $d..."

echo sf3z_user | sudo -S pg_dump -U postgres sfezdb -f /opt/SFEZ_server/db/backup/backup_$d.sql

echo "Done backing up..."

