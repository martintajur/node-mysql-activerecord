#!/usr/bin/env bash
mysql -uroot -e "CREATE DATABSE IF NOT EXISTS mock_db;"
mysql -uroot -e "CREATE USER IF NOT EXISTS 'travis'@'localhost';"
mysql -uroot -e "GRANT ALL ON `mock_db`.* TO 'travis'@'localhost';"
mysql -utravis mock_db < ./test/mysql/mock_data.sql
