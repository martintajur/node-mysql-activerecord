#!/usr/bin/env bash
server=localhost
admin_user=sa
admin_pass=Password123
db_user=travis
password=Password123
db_name=mock_db
db_table=cities
db2_name=mock_db2
db2_table=cities2

# Initial Admin Stuff
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $admin_user -P $admin_pass -Q "If not Exists (SELECT loginname FROM [master].[dbo].[syslogins] WHERE name = '$db_user') CREATE LOGIN $db_user WITH PASSWORD='$password';"
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $admin_user -P $admin_pass -Q "IF (db_id(N'$db_name') IS NULL) CREATE DATABASE $db_name;"
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $admin_user -P $admin_pass -Q "IF (db_id(N'$db2_name') IS NULL) CREATE DATABASE $db2_name;"
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $admin_user -P $admin_pass -d $db_name -Q "CREATE USER $db_user FOR LOGIN $db_user;" > /dev/null 2>&1
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $admin_user -P $admin_pass -d $db2_name -Q "CREATE USER $db_user FOR LOGIN $db_user;" > /dev/null 2>&1
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $admin_user -P $admin_pass -d $db_name -Q "GRANT CONTROL ON DATABASE:: $db_name TO $db_user;"
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $admin_user -P $admin_pass -d $db2_name -Q "GRANT CONTROL ON DATABASE:: $db2_name TO $db_user;"

# User stuff
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $db_user -P $password -d $db_name -Q "IF OBJECT_ID('dbo.$db_table', 'U') IS NOT NULL DROP TABLE dbo.$db_table;"
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $db_user -P $password -d $db2_name -Q "IF OBJECT_ID('dbo.$db2_table', 'U') IS NOT NULL DROP TABLE dbo.$db2_table;"
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $db_user -P $password -d $db_name -Q "CREATE TABLE $db_table([city] varchar(50) NOT NULL, [state_code] char(2) NOT NULL);"
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $db_user -P $password -d $db2_name -Q "CREATE TABLE $db2_table([city] varchar(50) NOT NULL, [state_code] char(2) NOT NULL);"
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $db_user -P $password -d $db_name -i mock_data.sql
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $db_user -P $password -d $db2_name -i mock_data2.sql

# Check to see if table exists now...
#sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -U $db_user -P $password -d $db_name -Q "SELECT TABLE_NAME FROM $db_name.INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"

# Check to see if data exists in $db_name
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $db_user -P $password -d $db_name -Q "SELECT TOP 5 * FROM [$db_table];"
sudo docker exec -it mssql-server-linux-latest /opt/mssql-tools/bin/sqlcmd -S $server -U $db_user -P $password -d $db2_name -Q "SELECT TOP 5 * FROM [$db2_table];"

echo "Done with MS SQL Import"