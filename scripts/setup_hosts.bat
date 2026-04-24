@echo off
:: =====================================================================
:: Configurador de Dominio Local - SPS Health
:: Modifica el archivo hosts de Windows para apuntar el dominio al servidor
:: =====================================================================

color 0B
echo =========================================
echo    Configuracion de Red - SPS Health
echo =========================================
echo.

:: 1. Comprobar permisos de Administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Privilegios de administrador confirmados.
) else (
    color 0C
    echo [ERROR] Falta de permisos.
    echo Por favor, cierra esta ventana. Haz clic derecho sobre este archivo
    echo (.bat) y selecciona "Ejecutar como administrador".
    echo.
    pause
    exit /b 1
)

:: 2. Variables de red
set HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts
set IP=192.168.1.123
set DOMAIN=spshealth.spsapp

echo.
echo Comprobando si el dominio ya esta configurado...

:: 3. Buscar si el dominio ya existe para no duplicarlo
findstr /C:"%DOMAIN%" "%HOSTS_FILE%" >nul
if %errorLevel% == 0 (
    color 0E
    echo.
    echo [INFO] El dominio %DOMAIN% ya esta configurado en esta computadora.
    echo No es necesario hacer nada mas.
    echo.
    pause
    exit /b 0
)

:: 4. Añadir la entrada al archivo hosts
echo. >> "%HOSTS_FILE%"
echo %IP% %DOMAIN% >> "%HOSTS_FILE%"

:: 5. Limpiar cache DNS de Windows para que tome efecto inmediato
ipconfig /flushdns >nul

color 0A
echo.
echo ========================================================
echo [EXITO] Configuracion completada correctamente.
echo Ahora puedes abrir tu navegador e ingresar a:
echo http://%DOMAIN%
echo ========================================================
echo.
pause
