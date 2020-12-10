d=$(date +%Y-%m-%d_%H-%M-%S)

ssh sfez@198.199.90.167 'bash -s' < copydatabase.sh $d

scp sfez@198.199.90.167:/opt/SFEZ_server/db/backup/backup_$d"".sql /tmp/backup_$d"".sql

echo backup_$d"".sql

sudo -u postgres psql -U postgres  -c "DROP DATABASE sfezdb;"

sudo -u postgres psql -U postgres  -c "DROP ROLE sfez_rw;"

sudo -u postgres psql -U postgres  -c "CREATE USER sfez_rw WITH PASSWORD 'sfez';"

sudo -u postgres psql -U postgres  -c "CREATE DATABASE sfezdb WITH OWNER = postgres ENCODING = 'UTF8' TABLESPACE = pg_default \
LC_COLLATE = 'pt_BR.UTF-8' LC_CTYPE = 'pt_BR.UTF-8' CONNECTION LIMIT = -1;"

sudo -u postgres psql -U postgres  -c "GRANT CONNECT ON DATABASE sfezdb TO sfez_rw;"

sudo -u postgres psql -U postgres -d sfezdb -f /tmp/backup_$d"".sql

