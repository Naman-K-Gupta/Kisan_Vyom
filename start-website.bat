@echo off
title Kisan Vyom Platform - Digital Mandi Assistance
color 0A
cls

cd /d "%~dp0"

echo =====================================================================
echo          KISAN VYOM - DIGITAL MANDI ^& AGRICULTURAL PLATFORM
echo =====================================================================
echo.
echo   [1] Farmer Portal ^& Dashboard
echo   [2] Pan-India APMC Procurement Centres ^& Live GPS Maps
echo   [3] Real-Time Weighing Bay Digital Queue ^& Token Pass
echo   [4] Direct Benefit Transfer (DBT) Payments ^& APMC Form-J Receipts
echo   [5] Centre Manager Operations Desk (Quality Assay ^& Weighbridge)
echo   [6] Kisan Sahayak AI Multimodal Agronomy Advisor
echo.
echo =====================================================================
echo.

:: 1. Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js v18 or higher from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 2. Check Backend Server (Port 5000)
echo [STATUS] Checking backend server on port 5000...
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% equ 0 goto :backend_running

echo [INFO] Starting Kisan Vyom backend server...
start "Kisan Vyom Backend" /min cmd /c "node server/dist/server.js"

set attempts=0
:wait_backend
set /a attempts+=1
timeout /t 1 /nobreak >nul
netstat -ano | findstr :5000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% equ 0 goto :backend_ready
if %attempts% lss 8 goto :wait_backend
echo [WARNING] Backend server is taking time to start, continuing...
goto :check_frontend

:backend_running
echo [OK] Backend server is already running on port 5000.
goto :check_frontend

:backend_ready
echo [OK] Backend server started successfully on http://localhost:5000!

:check_frontend
:: 3. Check Frontend Dev Server (Port 5173)
echo [STATUS] Checking frontend dev server on port 5173...
netstat -ano | findstr :5173 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% equ 0 goto :frontend_running

echo [INFO] Starting Vite frontend client...
start "Kisan Vyom Client" /min cmd /c "npm run dev --workspace=client"

set attempts=0
:wait_frontend
set /a attempts+=1
timeout /t 1 /nobreak >nul
netstat -ano | findstr :5173 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% equ 0 goto :frontend_ready
if %attempts% lss 6 goto :wait_frontend
goto :launch_website

:frontend_running
echo [OK] Frontend client is already running on port 5173.
goto :launch_website

:frontend_ready
echo [OK] Frontend client started on http://localhost:5173!

:launch_website
set "TARGET_URL=http://localhost:5173"
netstat -ano | findstr :5173 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% neq 0 set "TARGET_URL=http://localhost:5000"
:: 4. Launch Website in Default Browser reliably via PowerShell
echo.
echo [INFO] Opening Kisan Vyom in your default web browser...
echo [URL]  %TARGET_URL%

powershell -NoProfile -Command "Start-Process '%TARGET_URL%'" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    explorer "%TARGET_URL%" >nul 2>&1
)

echo.
echo =====================================================================
echo                     ACTIVE WEBSITE LINKS
echo =====================================================================
echo   * Home / Login:          %TARGET_URL%/
echo   * Centre Manager Desk:   %TARGET_URL%/manager/dashboard
echo   * Farmer Dashboard:      %TARGET_URL%/farmer/dashboard
echo   * Mandi Queue Tracker:   %TARGET_URL%/farmer/queue
echo   * APMC Mandi Centres:    %TARGET_URL%/farmer/centres
echo   * DBT Payments ^& Slips:  %TARGET_URL%/farmer/payments
echo   * Kisan Sahayak AI:      %TARGET_URL%/farmer/ai
echo   * State Admin Hub:       %TARGET_URL%/admin
echo =====================================================================
echo.
echo                     TEST LOGIN CREDENTIALS
echo =====================================================================
echo   Farmer:         9464204021 / Password@123
echo   Centre Manager: manager.karnal@smartfarmer.gov.in / Manager@12345
echo   State Admin:    admin@smartfarmer.gov.in / Admin@12345
echo =====================================================================
echo.
echo   [1] Re-open Website in Browser
echo   [2] Open Centre Manager Desk
echo   [3] Open Farmer Dashboard
echo   [4] Open Mandi Queue Tracker
echo   [5] Open State Admin Hub
echo   [X] Close Launcher Window
echo.
echo =====================================================================
echo   Website is running smoothly in the background.
echo =====================================================================
echo.

:menu_loop
choice /c 12345X /n /m "Press [1-5] to navigate, or [X] to exit launcher: "
if errorlevel 6 goto :exit_launcher
if errorlevel 5 goto :open_admin
if errorlevel 4 goto :open_queue
if errorlevel 3 goto :open_farmer
if errorlevel 2 goto :open_manager
if errorlevel 1 goto :open_home
goto :menu_loop

:open_home
powershell -NoProfile -Command "Start-Process '%TARGET_URL%'" >nul 2>&1
echo Opened: %TARGET_URL%
goto :menu_loop

:open_manager
powershell -NoProfile -Command "Start-Process '%TARGET_URL%/manager/dashboard'" >nul 2>&1
echo Opened: %TARGET_URL%/manager/dashboard
goto :menu_loop

:open_farmer
powershell -NoProfile -Command "Start-Process '%TARGET_URL%/farmer/dashboard'" >nul 2>&1
echo Opened: %TARGET_URL%/farmer/dashboard
goto :menu_loop

:open_queue
powershell -NoProfile -Command "Start-Process '%TARGET_URL%/farmer/queue'" >nul 2>&1
echo Opened: %TARGET_URL%/farmer/queue
goto :menu_loop

:open_admin
powershell -NoProfile -Command "Start-Process '%TARGET_URL%/admin'" >nul 2>&1
echo Opened: %TARGET_URL%/admin
goto :menu_loop

:exit_launcher
echo Exiting launcher. Background services remain active.
exit /b 0
