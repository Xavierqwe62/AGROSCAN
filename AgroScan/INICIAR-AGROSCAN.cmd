@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 24 y vuelve a abrir este archivo.
  pause
  exit /b 1
)
if not exist "node_modules\@angular\cli\bin\ng.js" (
  echo Instalando dependencias de AgroScan...
  call npm ci
  if errorlevel 1 (
    echo No se pudo completar la instalacion. Revisa el error anterior.
    pause
    exit /b 1
  )
)
echo Abre http://127.0.0.1:4201/ cuando el servidor termine de iniciar.
echo Manten esta ventana abierta mientras uses AgroScan.
call npm start -- --host 127.0.0.1 --port 4201
pause