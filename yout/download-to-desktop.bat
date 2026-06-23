@echo off
REM Run this on YOUR Windows PC to put everything on your Desktop
REM Double-click this file after downloading the repo

set DESKTOP=%USERPROFILE%\Desktop
set FOLDER=%DESKTOP%\yout

echo Creating yout folder on your Desktop...
if not exist "%DESKTOP%" mkdir "%DESKTOP%"

cd /d "%TEMP%"
if exist dissi-temp rmdir /s /q dissi-temp
git clone -b cursor/car-culture-production-html-8d03 --depth 1 https://github.com/dissiks/dissi.git dissi-temp
if exist "%FOLDER%" rmdir /s /q "%FOLDER%"
move dissi-temp\yout "%FOLDER%"
rmdir /s /q dissi-temp

echo.
echo DONE! Everything is here:
echo   %FOLDER%
echo.
explorer "%FOLDER%"
pause
