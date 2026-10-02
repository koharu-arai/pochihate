@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Pochihate
echo ============================================
echo  Pochihate : setup and start
echo ============================================
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%"
where node > nul 2> nul
if errorlevel 1 (
  echo [NG] Node.js is not installed. > setup-log.txt
  echo [NG] Node.js is not installed.
  echo      Install the LTS version from https://nodejs.org/ja and run this file again.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do set NODEV=%%v
echo [OK] Node.js %NODEV%
echo [OK] Node.js %NODEV% > setup-log.txt
if not exist node_modules (
  echo.
  echo Installing packages... ^(1-3 minutes^)
  call npm install >> setup-log.txt 2>&1
  if errorlevel 1 (
    echo [NG] npm install failed. See setup-log.txt
    echo [NG] npm install failed >> setup-log.txt
    pause
    exit /b 1
  )
  echo [OK] npm install done
  echo [OK] npm install done >> setup-log.txt
)
echo.
echo Starting... Open http://localhost:3000 in your browser.
echo Keep this window open while you use the app. Close it to stop.
call npm run dev > dev-log.txt 2>&1
pause
