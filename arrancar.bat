@echo off
TITLE StreamPro Launcher 🚀
CLS

ECHO ========================================================
ECHO    VERIFICACAO DO AMBIENTE DOCKER - STREAMPRO
ECHO ========================================================
ECHO.

:: 1. VERIFICAR SE O DOCKER ESTÁ A CORRER
docker info >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    ECHO [OK] O Docker ja esta a correr! Avancando...
    GOTO START_COMPOSE
)

:: 2. SE NÃO ESTIVER, TENTAR INICIAR
ECHO [!] O Docker nao esta a correr. A iniciar Docker Desktop...
ECHO.

:: Tenta iniciar o Docker no caminho padrao do Windows
IF EXIST "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
) ELSE (
    ECHO [ERRO] Nao encontrei o Docker Desktop em C:\Program Files\Docker\Docker\
    ECHO Por favor, inicie o Docker manualmente.
    PAUSE
    EXIT
)

:: 3. LOOP DE ESPERA (Aguarda até o Docker responder)
:WAIT_DOCKER
ECHO ... A aguardar que o motor do Docker arranque (isto pode demorar 1 min)...
TIMEOUT /T 5 /NOBREAK >nul
docker info >nul 2>&1
IF %ERRORLEVEL% NEQ 0 GOTO WAIT_DOCKER

ECHO.
ECHO [SUCESSO] Docker iniciado e pronto!
ECHO.

:START_COMPOSE
:: 4. ARRANCAR OS CONTENTORES
ECHO ========================================================
ECHO    A CONSTRUIR E INICIAR SERVICOS (Frontend + Backend)
ECHO ========================================================
ECHO.

:: Abre os links no navegador enquanto o Docker carrega (opcional)
start http://localhost:5173
start http://localhost:3000/api-docs

:: Comando final para levantar tudo
docker-compose up --build

PAUSE