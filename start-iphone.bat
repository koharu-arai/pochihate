@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Pochihate for iPhone (web)
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
if not exist node_modules (
  echo Installing packages...
  call npm install > setup-log.txt 2>&1
)
set "NEXT_DIST_DIR=.next-iphone"
echo Building the app... (1-3 minutes)
call npm run build > build-log.txt 2>&1
if errorlevel 1 (
  echo [NG] build failed >> build-log.txt
  echo [NG] Build failed. See build-log.txt
  pause
  exit /b 1
)
echo [OK] build done >> build-log.txt
echo.
echo ============================================================
echo  Open this on your iPhone (same Wi-Fi as this PC):
if exist iphone-address.txt del iphone-address.txt
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do for /f "tokens=*" %%b in ("%%a") do (
  echo     http://%%b:3002
  >> iphone-address.txt echo http://%%b:3002
)
echo  (Use the address that starts with 192.168.)
echo  Keep this window open while you use the app.
echo ============================================================
call npx next start -H 0.0.0.0 -p 3002 > serve-log.txt 2>&1
pause
