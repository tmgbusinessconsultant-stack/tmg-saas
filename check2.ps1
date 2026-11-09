# TMG CHECK 2 - Saves to results.txt so you can send me
$out = "results.txt"
"=== TMG CHECK 2 ===" | Out-File $out

"--- FRONTEND FILES ---" | Add-Content $out
Get-ChildItem -Path .\frontend\src -Recurse -File | Where-Object { $_.FullName -notmatch 'node_modules' } | Select-Object -ExpandProperty FullName | Add-Content $out

"`n--- FRONTEND: quote-request ---" | Add-Content $out
Get-ChildItem -Path .\frontend\src -Recurse -File -Include *.tsx,*.ts | Where-Object { $_.FullName -notmatch 'node_modules' } | Select-String -Pattern "quote-request" | ForEach-Object { "$($_.Path):$($_.LineNumber) => $($_.Line)" } | Add-Content $out

"`n--- FRONTEND: fetch / api url ---" | Add-Content $out
Get-ChildItem -Path .\frontend\src -Recurse -File -Include *.tsx,*.ts | Where-Object { $_.FullName -notmatch 'node_modules' } | Select-String -Pattern "onrender|NEXT_PUBLIC_API|api/" | ForEach-Object { "$($_.Path):$($_.LineNumber) => $($_.Line.Trim())" } | Add-Content $out

"`n--- BACKEND: quote-requests controller ---" | Add-Content $out
Get-ChildItem -Path .\src\quote-requests -File | Select-Object -ExpandProperty FullName | Add-Content $out
Get-Content .\src\quote-requests\*.controller.ts | Add-Content $out

"`n--- BACKEND: forms controller ---" | Add-Content $out
Get-ChildItem -Path .\src\forms -File | Select-Object -ExpandProperty FullName | Add-Content $out
Get-Content .\src\forms\*.ts | Select-String -Pattern "Controller|Post|Get|quote" | ForEach-Object { $_.Line } | Add-Content $out

"`n--- FRONTEND ADMIN FILES CONTENT: fetch ---" | Add-Content $out
Get-ChildItem -Path .\frontend\src\app\admin -Recurse -File | Select-Object -ExpandProperty FullName | Add-Content $out
Get-ChildItem -Path .\frontend\src\app\admin -Recurse -File -Include *.tsx,*.ts | Select-String -Pattern "fetch|quote|api" | ForEach-Object { "$($_.Path):$($_.LineNumber) => $($_.Line.Trim())" } | Add-Content $out

"`n--- SEARCH ---" | Add-Content $out
Get-ChildItem -Path .\frontend\src -Recurse -File -Include *.tsx,*.ts | Where-Object { $_.FullName -notmatch 'node_modules' } | Select-String -Pattern "search" | ForEach-Object { "$($_.Path):$($_.LineNumber) => $($_.Line.Trim())" } | Add-Content $out

Write-Host "DONE - Open results.txt"
Get-Content $out