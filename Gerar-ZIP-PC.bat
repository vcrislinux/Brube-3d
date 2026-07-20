@echo off
setlocal enabledelayedexpansion
title Gerar ZIP PC - Brube Calc
cd /d "%~dp0"

set "NODE_OPTIONS=--use-system-ca"

echo ============================================
echo    GERANDO ZIP DA VERSAO PC - BRUBE CALC
echo ============================================
echo.

if not exist "node_modules" (
    echo [0/3] Instalando dependencias ^(primeira vez^)...
    call npm install || goto :erro
)

echo [1/3] Atualizando arquivos web...
call npm run www || goto :erro

echo [2/3] Copiando instrucoes...
if exist "COMO-ABRIR-NO-PC.txt" copy /Y "COMO-ABRIR-NO-PC.txt" "www\COMO-ABRIR-NO-PC.txt" >nul

echo [3/3] Compactando em BrubeCalc-PC.zip...
if exist "BrubeCalc-PC.zip" del /F /Q "BrubeCalc-PC.zip"
powershell -NoProfile -Command "Compress-Archive -Path 'www\*' -DestinationPath 'BrubeCalc-PC.zip' -Force" || goto :erro

echo.
echo ============================================
echo    ZIP GERADO COM SUCESSO!
echo    Arquivo: %CD%\BrubeCalc-PC.zip
echo ============================================
echo.
echo Agora e so enviar o BrubeCalc-PC.zip para o cliente.
echo O cliente extrai a pasta e abre o index.html no navegador.
goto :fim

:erro
echo.
echo *** OCORREU UM ERRO. Veja as mensagens acima. ***

:fim
echo.
pause
