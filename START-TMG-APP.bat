@echo off
cd /d "%~dp0"
echo Starting TMG...

REM Backend is in this folder (tmg-saas)
start "TMG Backend 4000" cmd /k npm run start:dev

REM Frontend - adjust path if needed
timeout /t 8
start "TMG Frontend 3000" cmd /k "cd /d ..\frontend && npm run dev  || cd /d ..\tmg\frontend && npm run dev || cd /d frontend && npm run dev"

echo Done! Open http://localhost:3000