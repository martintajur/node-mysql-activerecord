#!/usr/bin/env bash
server=localhost
admin_user=sa
admin_pass=Password123
db_user=travis
password=Password123
db_name=mock_db
db_table=cities

# Initial Admin Stuff
sqlcmd -S $server -U $admin_user -P $admin_pass -Q "If not Exists (SELECT loginname FROM [master].[dbo].[syslogins] WHERE name = '$db_user') CREATE LOGIN $db_user WITH PASSWORD='$password';"
sqlcmd -S $server -U $admin_user -P $admin_pass -Q "IF (db_id(N'$db_name') IS NULL) CREATE DATABASE $db_name;"
sqlcmd -S $server -U $admin_user -P $admin_pass -d $db_name -Q "IF NOT EXISTS (SELECT * FROM [sys].[server_principals] WHERE [name] = '$db_user') CREATE USER $db_user FOR LOGIN $db_user;"
sqlcmd -S $server -U $admin_user -P $admin_pass -d $db_name -Q "GRANT CONTROL ON DATABASE:: $db_name TO $db_user;"

# User stuff
sqlcmd -S $server -U $db_user -P $password -d $db_name -Q "IF OBJECT_ID('dbo.$db_table', 'U') IS NOT NULL DROP TABLE dbo.$db_table;"
sqlcmd -S $server -U $db_user -P $password -d $db_name -Q "CREATE TABLE $db_table([city] varchar(50) NOT NULL, [state_code] char(2) NOT NULL);"
sqlcmd -S $server -U $db_user -P $password -d $db_name -i mock_data.sql

# Check to see if table exists now...
#sqlcmd -U $db_user -P $password -d $db_name -Q "SELECT TABLE_NAME FROM $db_name.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"

# Check to see if data exists in $db_name
sqlcmd -S $server -U $db_user -P $password -d $db_name -Q "SELECT TOP 5 * FROM [cities];"
