#! /bin/sh

## SFEZ DATABASE CREATION
#
# Make sure ALL connections (app, pgAdmin) to db are disconnected before running
#
# Note: psql must be in $PATH

#t=$(date "+%Y.%m.%d-%H.%M.%S")

#echo "Backing up db with timestamp $t..."
#pg_dump -U postgres sfezdb -f logs/backup_$t.sql
#echo "...done"
#echo

echo "Drop database and roles..."
psql -U postgres  -c "DROP DATABASE sfezdb;"
psql -U postgres  -c "DROP ROLE sfez_rw;"
echo "...done"
echo

echo "Create app user role and database, and grant permissions..."
psql -U postgres  -c "CREATE USER sfez_rw WITH PASSWORD 'sfez';"

psql -U postgres  -c "CREATE DATABASE sfezdb WITH OWNER = postgres ENCODING = 'UTF8' TABLESPACE = pg_default CONNECTION LIMIT = -1 TEMPLATE = 'template0' ;"

psql -U postgres  -c "GRANT CONNECT ON DATABASE sfezdb TO sfez_rw;"
echo "...done"
echo

## CREATE EMPTY SCHEMA + LOOKUP TABLES
echo "Creating schema..."
psql -U postgres  -d sfezdb -f sfez_create_tables.sql
echo "...done"

## TEST DATA INSERTION
## Uncomment psql line below

 echo "Creating test data..."
 psql -U postgres sfezdb < sfez_create_test_data.dmp
 echo "...done"
