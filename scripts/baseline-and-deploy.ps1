# Baseline: marca migrations já aplicadas no banco (schema nao vazio)
# Depois aplica apenas a migration nova (sort_order)
# Execute com: .\scripts\baseline-and-deploy.ps1

Set-Location $PSScriptRoot\..

Write-Host "Marcando migrations existentes como aplicadas (baseline)..." -ForegroundColor Cyan
npx prisma migrate resolve --applied "20250219160000_init_casos_evidence"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx prisma migrate resolve --applied "20250220000000_add_users_sessions"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Aplicando nova migration (sort_order)..." -ForegroundColor Cyan
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Concluido." -ForegroundColor Green
