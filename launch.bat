@echo off
chcp 65001 > nul
echo Starting Web AI IDE...
echo.
set "EXE_PATH=%~dp0release\latest\win-unpacked\Web AI IDE.exe"
if not exist "%EXE_PATH%" (
    echo Error: Executable not found at %EXE_PATH%
    pause
    exit /b 1
)
"%EXE_PATH%"
