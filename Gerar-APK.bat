@echo off
setlocal enabledelayedexpansion
title Gerar APK - Brube Calc
cd /d "%~dp0"

for /d %%i in ("C:\Program Files\Eclipse Adoptium\jdk-17*") do set "JAVA_HOME=%%i"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "NODE_OPTIONS=--use-system-ca"

echo ============================================
echo    GERANDO APK DO BRUBE CALC
echo ============================================
echo.

set "APP_VER="
for /f "usebackq tokens=2 delims==" %%A in (`findstr /C:"const APP_VERSAO" "js\licenca-config.js"`) do (
  set "APP_VER=%%~A"
)
set "APP_VER=!APP_VER: =!"
set "APP_VER=!APP_VER:;=!"
set "APP_VER=!APP_VER:"=!"
if "!APP_VER!"=="" set "APP_VER=0.0.0"

for /f "tokens=1,2,3 delims=." %%a in ("!APP_VER!") do (
  set /a "VCODE=%%a*10000 + %%b*100 + %%c" 2>nul
)
if not defined VCODE set "VCODE=1"

echo Versao do app: !APP_VER!  ^(versionCode !VCODE!^)
echo.

powershell -NoProfile -Command ^
  "$p='android\app\build.gradle'; $t=Get-Content $p -Raw; $t=$t -replace 'versionCode\s+\d+','versionCode !VCODE!'; $t=$t -replace 'versionName\s+\"[^\"]+\"','versionName \"!APP_VER!\"'; Set-Content $p $t -NoNewline"

if not exist "node_modules" (
    echo [0/4] Instalando dependencias ^(primeira vez^)...
    call npm install || goto :erro
)

echo [1/4] Atualizando arquivos web...
call npm run www || goto :erro

echo [2/4] Sincronizando com o Android...
call npx cap sync android || goto :erro

echo [3/4] Compilando o APK ^(pode demorar alguns minutos^)...
cd android
call gradlew.bat assembleDebug --offline || (cd .. & goto :erro)
cd ..

echo [4/4] Copiando o APK para a pasta principal...
set "OUT=BrubeCalc-!APP_VER!.apk"
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "!OUT!" >nul
copy /Y "!OUT!" "BrubeCalc.apk" >nul

echo.
echo ============================================
echo    APK GERADO COM SUCESSO!
echo    Arquivo: %CD%\!OUT!
echo    Copia:   %CD%\BrubeCalc.apk
echo ============================================
echo.
echo Agora e so enviar o !OUT! para o celular e instalar.
goto :fim

:erro
echo.
echo *** OCORREU UM ERRO. Veja as mensagens acima. ***

:fim
echo.
pause
