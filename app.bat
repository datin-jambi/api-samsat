@echo off
REM ======================================
REM BPKPD API - All-in-One Management Script
REM ======================================
REM Usage:
REM   app.bat deploy    - Deploy/update aplikasi
REM   app.bat rollback  - Rollback ke versi sebelumnya
REM   app.bat start     - Start aplikasi
REM   app.bat stop      - Stop aplikasi
REM   app.bat restart   - Restart aplikasi
REM   app.bat status    - Cek status aplikasi
REM   app.bat logs      - Lihat logs

setlocal enabledelayedexpansion

set COMMAND=%1
set APP_NAME=bpkpd-api
set BACKUP_DIR=backups

if "%COMMAND%"=="" goto :help
if /i "%COMMAND%"=="deploy" goto :deploy
if /i "%COMMAND%"=="rollback" goto :rollback
if /i "%COMMAND%"=="start" goto :start
if /i "%COMMAND%"=="stop" goto :stop
if /i "%COMMAND%"=="restart" goto :restart
if /i "%COMMAND%"=="status" goto :status
if /i "%COMMAND%"=="logs" goto :logs
goto :help

REM ======================================
REM DEPLOY
REM ======================================
:deploy
echo.
echo ==========================================
echo   DEPLOYING BPKPD API
echo ==========================================
echo.

REM Check prerequisites
echo [1/9] Checking prerequisites...
where git >nul 2>&1 || (echo ERROR: Git not found! && goto :error)
where docker >nul 2>&1 || (echo ERROR: Docker not found! && goto :error)
where docker-compose >nul 2>&1 || (echo ERROR: Docker Compose not found! && goto :error)
echo OK
echo.

REM Create backup
echo [2/9] Creating backup...
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if exist ".env" copy ".env" "%BACKUP_DIR%\.env.%TIMESTAMP%" >nul
docker save %APP_NAME%:latest -o "%BACKUP_DIR%\%APP_NAME%_%TIMESTAMP%.tar" 2>nul
echo OK
echo.

REM Stop containers
echo [3/9] Stopping containers...
docker-compose -f docker-compose.prod.yml down 2>nul
echo OK
echo.

REM Pull latest code
echo [4/9] Pulling from GitHub...
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i
git status --porcelain > temp.txt
for %%A in (temp.txt) do set SIZE=%%~zA
if !SIZE! GTR 0 git stash
del temp.txt
git pull origin %BRANCH% || (echo ERROR: Git pull failed! && goto :error)
echo OK
echo.

REM Check .env
echo [5/9] Checking environment...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo WARNING: Please update .env file!
        pause
    ) else (
        echo ERROR: No .env file found!
        goto :error
    )
)
echo OK
echo.

REM Lint
echo [6/9] Running linter...
call npm run lint >nul 2>&1
echo OK
echo.

REM Build
echo [7/9] Building Docker image...
docker-compose -f docker-compose.prod.yml build --no-cache || (
    echo ERROR: Build failed!
    set /p ROLLBACK="Rollback? (y/n): "
    if /i "!ROLLBACK!"=="y" call :do_rollback %TIMESTAMP%
    goto :error
)
echo OK
echo.

REM Start
echo [8/9] Starting containers...
docker-compose -f docker-compose.prod.yml up -d || (echo ERROR: Start failed! && goto :error)
echo OK
echo.

REM Health check
echo [9/9] Health check...
timeout /t 5 /nobreak >nul
set RETRY=0
:deploy_health_loop
curl -s -o nul http://localhost:3333/health 2>nul && goto :deploy_success
set /a RETRY+=1
if %RETRY% GEQ 10 (
    echo ERROR: Health check failed!
    set /p ROLLBACK="Rollback? (y/n): "
    if /i "!ROLLBACK!"=="y" call :do_rollback %TIMESTAMP%
    goto :error
)
timeout /t 3 /nobreak >nul
goto :deploy_health_loop

:deploy_success
REM Cleanup old backups
for /f "skip=10 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\*.tar" 2^>nul') do del "%BACKUP_DIR%\%%F" 2>nul
for /f "skip=10 delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\.env.*" 2^>nul') do del "%BACKUP_DIR%\%%F" 2>nul

echo.
echo ==========================================
echo   DEPLOYMENT SUCCESS!
echo ==========================================
echo.
echo Application: http://localhost:3333
echo Rollback: app.bat rollback %TIMESTAMP%
echo.
goto :end

REM ======================================
REM ROLLBACK
REM ======================================
:rollback
echo.
echo ==========================================
echo   ROLLBACK
echo ==========================================
echo.

set TIMESTAMP=%2
if "%TIMESTAMP%"=="" (
    echo Available backups:
    set COUNT=0
    for /f "tokens=*" %%F in ('dir /b /o-d "%BACKUP_DIR%\*.tar"') do (
        set FILE=%%F
        set TIME=!FILE:%APP_NAME%_=!
        set TIME=!TIME:.tar=!
        echo [!COUNT!] !TIME!
        set BACKUP_!COUNT!=!TIME!
        set /a COUNT+=1
    )
    if !COUNT! EQU 0 (echo No backups found! && goto :error)
    set /p SEL="Select: "
    set TIMESTAMP=!BACKUP_%SEL%!
)

set /p CONFIRM="Rollback to %TIMESTAMP%? (yes/no): "
if /i NOT "%CONFIRM%"=="yes" (echo Cancelled && goto :end)

call :do_rollback %TIMESTAMP%
goto :end

:do_rollback
set TS=%1
echo Stopping...
docker-compose -f docker-compose.prod.yml down
if exist "%BACKUP_DIR%\.env.%TS%" copy "%BACKUP_DIR%\.env.%TS%" ".env" >nul
if exist "%BACKUP_DIR%\%APP_NAME%_%TS%.tar" docker load -i "%BACKUP_DIR%\%APP_NAME%_%TS%.tar"
echo Starting...
docker-compose -f docker-compose.prod.yml up -d
timeout /t 5 /nobreak >nul
curl -s -o nul http://localhost:3333/health 2>nul && (
    echo Rollback SUCCESS!
) || (
    echo Rollback completed but health check failed
)
exit /b 0

REM ======================================
REM START
REM ======================================
:start
echo Starting...
docker-compose -f docker-compose.prod.yml up -d
timeout /t 3 /nobreak >nul
goto :status

REM ======================================
REM STOP
REM ======================================
:stop
echo Stopping...
docker-compose -f docker-compose.prod.yml down
echo Stopped
goto :end

REM ======================================
REM RESTART
REM ======================================
:restart
echo Restarting...
docker-compose -f docker-compose.prod.yml restart
timeout /t 3 /nobreak >nul
goto :status

REM ======================================
REM STATUS
REM ======================================
:status
echo.
echo Service Status:
docker-compose -f docker-compose.prod.yml ps
echo.
curl -s http://localhost:3333/health 2>nul && (
    echo [OK] Application is healthy
) || (
    echo [ERROR] Application not responding
)
goto :end

REM ======================================
REM LOGS
REM ======================================
:logs
echo Logs (Ctrl+C to exit):
docker-compose -f docker-compose.prod.yml logs -f --tail=100
goto :end

REM ======================================
REM HELP
REM ======================================
:help
echo.
echo BPKPD API Management
echo.
echo Usage:
echo   app.bat deploy    - Deploy/update aplikasi dari GitHub
echo   app.bat rollback  - Rollback ke versi sebelumnya
echo   app.bat start     - Start aplikasi
echo   app.bat stop      - Stop aplikasi
echo   app.bat restart   - Restart aplikasi
echo   app.bat status    - Cek status dan health
echo   app.bat logs      - Lihat logs real-time
echo.
goto :end

REM ======================================
REM ERROR & END
REM ======================================
:error
echo.
echo FAILED!
pause
exit /b 1

:end
exit /b 0
