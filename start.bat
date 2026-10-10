@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
    py -3 run.py %*
) else (
    python run.py %*
)
if errorlevel 1 (
    echo.
    echo No se pudo iniciar. Consulta INSTALACION.md y verifica que Python este instalado.
    pause
    exit /b 1
)
