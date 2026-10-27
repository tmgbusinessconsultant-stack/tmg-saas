Write-Host "=== TMG SAAS FULL CHECK ===" -ForegroundColor Cyan

Write-Host "`n1. FRONTEND ENV" -ForegroundColor Yellow
Get-Content C:\tmg-saas\frontend\.env.local -ErrorAction SilentlyContinue
if (-not $?) { Write-Host "NO .env.local found!" -ForegroundColor Red }

Write-Host "`n2. BACKEND ENV" -ForegroundColor Yellow
Get-Content C:\tmg-saas\backend\.env -ErrorAction SilentlyContinue | Select-String -Pattern "PORT|DATABASE_URL|JWT|API" 

Write-Host "`n3. PORTS LISTENING" -ForegroundColor Yellow
netstat -ano | Select-String "5000|3000|3001"

Write-Host "`n4. BACKEND BUILD EXISTS?" -ForegroundColor Yellow
Test-Path C:\tmg-saas\backend\dist\src\main.js

Write-Host "`n5. TRY BACKEND HEALTH" -ForegroundColor Yellow
try { Invoke-RestMethod http://localhost:5000/api/health -TimeoutSec 3; Write-Host "Backend 5000 OK" -ForegroundColor Green } catch { Write-Host "Backend 5000 FAILED: $_" -ForegroundColor Red }
try { Invoke-RestMethod http://localhost:3001/api/health -TimeoutSec 3; Write-Host "Backend 3001 OK" -ForegroundColor Green } catch { Write-Host "Backend 3001 FAILED: $_" -ForegroundColor Red }
try { Invoke-RestMethod http://localhost:5000/health -TimeoutSec 3; Write-Host "Backend /health OK" -ForegroundColor Green } catch { Write-Host "/health FAILED: $_" -ForegroundColor Red }

Write-Host "`n6. TRY AUTH LOGIN ENDPOINT" -ForegroundColor Yellow
try {
 $body = @{ email="test@test.com"; password="test123" } | ConvertTo-Json
 Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5
} catch { Write-Host "LOGIN ENDPOINT ERROR: $($_.Exception.Message)" -ForegroundColor Red; Write-Host $_.Exception.Response }

Write-Host "`n7. PRISMA CLIENT" -ForegroundColor Yellow
Test-Path C:\tmg-saas\backend\node_modules\@prisma\client

Write-Host "`n=== END CHECK ===" -ForegroundColor Cyan