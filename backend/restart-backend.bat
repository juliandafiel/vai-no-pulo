@echo off
echo Parando processos Node.js...
taskkill /F /IM node.exe

echo.
echo Aguardando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo Regenerando Prisma Client...
cd /d "%~dp0"
call npx prisma generate

echo.
echo Iniciando backend...
call npm run start:dev
