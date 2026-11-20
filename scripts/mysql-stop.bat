@echo off
set ROOT=%~dp0..
"%ROOT%_toolsmysql-8.4.7-winx64inmysqladmin.exe" -uroot -h127.0.0.1 -P3306 shutdown
echo [STOP] MySQL stopped.
