# CV Builder — Unified Local Development Runner
# Starts both the .NET 10 Minimal API and Next.js 16 Frontend

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Starting CV Builder Development Environment" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
if (-not $root) {
    $root = Get-Location
}

$backendDir = Join-Path $root "backend\CvBuilder.Backend"
$frontendDir = Join-Path $root "frontend"

# Check & start local MongoDB container if Docker is available
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        $mongoStatus = docker inspect --format="{{.State.Running}}" cvbuilder-mongo 2>$null
        if ($mongoStatus -ne "true") {
            Write-Host "[0/2] Starting local MongoDB container (cvbuilder-mongo)..." -ForegroundColor Magenta
            docker start cvbuilder-mongo 2>$null
            if ($LASTEXITCODE -ne 0) {
                docker compose -f (Join-Path $root "docker-compose.yml") up -d mongodb 2>$null
            }
        } else {
            Write-Host "[0/2] Local MongoDB container (cvbuilder-mongo) is active (:27017)." -ForegroundColor DarkGreen
        }
    }
} catch {
    # Ignore if docker is not running
}

Write-Host "[1/2] Launching .NET 10 Minimal API (:5139)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    dotnet run
} -ArgumentList $backendDir

Write-Host "[2/2] Launching Next.js 16 Frontend (:3000)..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $frontendDir

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor Green
Write-Host "  Services running:" -ForegroundColor Green
Write-Host "  - Backend API: http://localhost:5139" -ForegroundColor Green
Write-Host "  - Frontend:    http://localhost:3000" -ForegroundColor Green
Write-Host "------------------------------------------------------------" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop all development services." -ForegroundColor DarkGray
Write-Host ""

try {
    while ($true) {
        # Check backend job output
        $bOut = Receive-Job -Job $backendJob
        if ($bOut) {
            foreach ($line in $bOut) {
                Write-Host "[backend] $line" -ForegroundColor DarkCyan
            }
        }

        # Check frontend job output
        $fOut = Receive-Job -Job $frontendJob
        if ($fOut) {
            foreach ($line in $fOut) {
                Write-Host "[frontend] $line" -ForegroundColor DarkYellow
            }
        }

        # Check if either job failed
        if ($backendJob.State -eq 'Failed' -or $backendJob.State -eq 'Stopped') {
            Write-Warning "Backend job stopped unexpectedly."
            break
        }
        if ($frontendJob.State -eq 'Failed' -or $frontendJob.State -eq 'Stopped') {
            Write-Warning "Frontend job stopped unexpectedly."
            break
        }

        Start-Sleep -Milliseconds 500
    }
}
finally {
    Write-Host "`nStopping background development jobs..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Host "All development jobs stopped." -ForegroundColor Green
}
