# ===== TMG LOCAL AUDIT - POWERSHELL =====
Write-Host "========== TMG LOCAL AUDIT ==========" -ForegroundColor Cyan

Write-Host "`n1. PROJECT FILES:" -ForegroundColor Yellow
Get-ChildItem | Select-Object Name, Length | Format-Table

Write-Host "`n2. SRC STRUCTURE:" -ForegroundColor Yellow
if(Test-Path "src"){ Get-ChildItem -Recurse -Directory src | Select-Object FullName }
if(Test-Path "app"){ Get-ChildItem -Recurse -Directory app | Select-Object FullName }
if(Test-Path "backend"){ Get-ChildItem -Recurse backend | Select-Object FullName }

Write-Host "`n3. WHERE DO FORMS SEND? SEARCHING..." -ForegroundColor Yellow
Write-Host "--- /api/quote ---"
Get-ChildItem -Recurse -Include *.js,*.ts,*.tsx,*.jsx -Exclude node_modules | Select-String -Pattern "api/quote" | Select-Object Path, LineNumber, Line | Format-List

Write-Host "--- /api/contact ---"
Get-ChildItem -Recurse -Include *.js,*.ts,*.tsx,*.jsx | Select-String -Pattern "api/contact" | Select-Object Path, LineNumber, Line | Format-List

Write-Host "--- /api/booking ---"
Get-ChildItem -Recurse -Include *.js,*.ts,*.tsx,*.jsx | Select-String -Pattern "api/booking" | Select-Object Path, LineNumber, Line | Format-List

Write-Host "--- /api/search ---"
Get-ChildItem -Recurse -Include *.js,*.ts,*.tsx,*.jsx | Select-String -Pattern "api/search" | Select-Object Path, LineNumber, Line | Format-List

Write-Host "`n4. ADMIN PAGE - WHAT DOES IT FETCH?" -ForegroundColor Yellow
Get-ChildItem -Recurse -Include *.js,*.ts,*.tsx,*.jsx | Select-String -Pattern "quote-requests" | Select-Object Path, LineNumber, Line | Format-List

Write-Host "`n5. BACKEND ROUTES:" -ForegroundColor Yellow
Get-ChildItem -Recurse -Include *.js,*.ts | Select-String -Pattern "quote-requests|app\.post|router\.post" | Select-Object Path, LineNumber, Line | Format-List

Write-Host "`n========== AUDIT DONE ==========" -ForegroundColor Green