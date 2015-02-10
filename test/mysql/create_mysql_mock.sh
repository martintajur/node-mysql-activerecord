#!/usr/bin/env bash
mysql -e 'create database mock_db;'
mysql -utravis mock_db < ./test/mysql/mock_data.sql