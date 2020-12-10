#!/bin/bash -eux

#docker-compose up -d
docker-compose exec sfez-pgclient bash -c 'psql < /sqls/sfez_database_setup.sql'
docker-compose exec sfez-pgclient bash -c 'psql sfezdb < /sqls/sfez_create_tables.sql'
docker-compose exec sfez-pgclient bash -c 'psql sfezdb < /sqls/sfez_create_minimal_prod_baseline_data.dmp'
#docker-compose down
