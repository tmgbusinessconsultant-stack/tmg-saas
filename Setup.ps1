$ErrorActionPreference = "Stop"

if (-not (Test-Path "package.json") -or -not (Test-Path "frontend\package.json")) {
  throw "Run Setup.ps1 from the TMG repository root."
}

$nodeVersion = (node --version).TrimStart("v")
$nodeMajor = [int]($nodeVersion.Split(".")[0])
$nodeMinor = [int]($nodeVersion.Split(".")[1])
if ($nodeMajor -lt 20 -or ($nodeMajor -eq 20 -and $nodeMinor -lt 9)) {
  throw "Node.js 20.9 or newer is required. Detected $nodeVersion."
}

npm ci
if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed." }

Push-Location frontend
try {
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed." }
}
finally {
  Pop-Location
}

Write-Host "Setup complete. Configure .env and frontend\.env.local from the example files before starting the apps." -ForegroundColor Green
