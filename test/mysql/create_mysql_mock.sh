#!/usr/bin/env bash
mysql -uroot -p -e "CREATE DATABASE IF NOT EXISTS mock_db;"
mysql -uroot -p -e "CREATE DATABASE IF NOT EXISTS mock_db2;"
mysql -uroot -p -e "CREATE USER IF NOT EXISTS 'travis'@'localhost';"
mysql -uroot -p -e "GRANT ALL ON mock_db.* TO 'travis'@'localhost';"
mysql -uroot -p -e "GRANT ALL ON mock_db2.* TO 'travis'@'localhost';"
mysql -uroot -p mock_db -e "DROP TABLE IF EXISTS cities;"
mysql -uroot -p mock_db2 -e "DROP TABLE IF EXISTS cities2;"
mysql -utravis mock_db < ./mock_data.sql
mysql -utravis mock_db2 < ./mock_data2.sql
