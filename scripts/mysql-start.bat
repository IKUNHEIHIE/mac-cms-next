@echo off
setlocal
set ROOT=%~dp0..
set MYSQL=%ROOT%_toolsmysql-8.4.7-winx64
if not exist "%MYSQL%inmysqld.exe" (
  echo [ERROR] MySQL not found at %MYSQL%
  echo Download mysql-8.4.7-winx64.zip and extract to _tools  exit /b 1
)
if not exist "%ROOT%_toolsmysql-datamysql" (
  echo [SETUP] Initializing MySQL data directory...
  "%MYSQL%inmysqld.exe" --initialize-insecure --basedir="%MYSQL%" --datadir="%ROOT%_toolsmysql-data"
  "%MYSQL%inmysql.exe" -uroot -h127.0.0.1 -P3306 -e "CREATE DATABASE IF NOT EXISTS maccms DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
)
echo [START] MySQL 8.4 on 127.0.0.1:3306
start "MAC CMS MySQL" "%MYSQL%inmysqld.exe" --basedir="%MYSQL%" --datadir="%ROOT%_toolsmysql-data" --port=3306 --bind-address=127.0.0.1 --mysqlx=0 --console
endlocal
