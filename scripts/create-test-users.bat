@echo off
REM Script batch pour créer les utilisateurs de test sur Windows
REM Usage: create-test-users.bat

echo ============================================================
echo 🔧 Création des utilisateurs de test
echo ============================================================
echo.

REM Essayer python3, puis python, puis py
where python3 >nul 2>&1
if %ERRORLEVEL% == 0 (
    set PYTHON_CMD=python3
    goto :run
)

where python >nul 2>&1
if %ERRORLEVEL% == 0 (
    set PYTHON_CMD=python
    goto :run
)

where py >nul 2>&1
if %ERRORLEVEL% == 0 (
    set PYTHON_CMD=py
    goto :run
)

echo ❌ Python n'est pas trouvé dans le PATH
echo.
echo Installez Python depuis https://www.python.org/downloads/
echo OU utilisez PowerShell: .\create-test-users.ps1
echo.
pause
exit /b 1

:run
echo Utilisation de: %PYTHON_CMD%
echo.

cd /d "%~dp0\.."
%PYTHON_CMD% scripts\create-test-users.py

if %ERRORLEVEL% == 0 (
    echo.
    echo ✅ Script exécuté avec succès
) else (
    echo.
    echo ❌ Erreur lors de l'exécution
)

pause

