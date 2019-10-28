#!/usr/bin/env bash
mysql -uroot -e "CREATE DATABASE IF NOT EXISTS mock_db;"
mysql -uroot -e "CREATE DATABASE IF NOT EXISTS mock_db2;"
mysql -uroot -e "CREATE USER IF NOT EXISTS 'travis'@'localhost';"
mysql -uroot -e "GRANT ALL ON mock_db.* TO 'travis'@'localhost';"
mysql -uroot -e "GRANT ALL ON mock_db2.* TO 'travis'@'localhost';"
mysql -uroot mock_db -e "DROP TABLE IF EXISTS cities;"
mysql -uroot mock_db2 -e "DROP TABLE IF EXISTS cities2;"
mysql -utravis mock_db < ./test/mysql/mock_data.sql
mysql -utravis mock_db2 < ./test/mysql/mock_data2.sql

echo "Done with MySQL Import"