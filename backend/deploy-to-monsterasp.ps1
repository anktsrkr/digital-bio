param (
    [string]$Server = ($env:MONSTERASP_FTP_SERVER ?? "site102544.siteasp.net"),
    [string]$User = ($env:MONSTERASP_FTP_USER ?? "site102544"),
    [string]$Pass = $env:MONSTERASP_FTP_PASSWORD,
    [string]$RemoteRoot = "wwwroot",
    [switch]$SkipBuild
)

if ([string]::IsNullOrWhiteSpace($Pass)) {
    Write-Host "FTP password not provided via -Pass or MONSTERASP_FTP_PASSWORD env var." -ForegroundColor Yellow
}

$ErrorActionPreference = "Stop"
$ProjectDir = Join-Path $PSScriptRoot "CvBuilder.Backend"
$PublishDir = Join-Path $ProjectDir "publish-portable"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " CvBuilder Backend Deployment -> $Server" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Build and Publish (Portable AnyCPU)
if (-not $SkipBuild) {
    Write-Host "`n[1/4] Publishing CvBuilder.Backend (Release, Portable AnyCPU)..." -ForegroundColor Yellow
    
    if (Test-Path $PublishDir) {
        Remove-Item -Recurse -Force $PublishDir -ErrorAction SilentlyContinue
    }
    
    & dotnet publish $ProjectDir -c Release -o $PublishDir
    if ($LASTEXITCODE -ne 0) {
        Write-Error "dotnet publish failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }

    # Remove non-Windows runtimes to save bandwidth and upload time
    Get-ChildItem -Path (Join-Path $PublishDir "runtimes") -Directory | Where-Object { $_.Name -notlike "win*" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

    # Copy 32-bit (x86) QuestPdfSkia native dependencies to publish root for MonsterASP IIS 32-bit compatibility
    $x86NativeDir = Join-Path $PublishDir "runtimes\win-x86\native"
    if (Test-Path $x86NativeDir) {
        Copy-Item (Join-Path $x86NativeDir "*") -Destination $PublishDir -Force
    }

    # Ensure web.config enables stdout logging and uses inprocess hosting
    $webConfigFile = Join-Path $PublishDir "web.config"
    if (Test-Path $webConfigFile) {
        $xmlContent = Get-Content -Raw $webConfigFile
        $xmlContent = $xmlContent -replace 'stdoutLogEnabled="false"', 'stdoutLogEnabled="true"'
        $xmlContent = $xmlContent -replace 'hostingModel="OutOfProcess"', 'hostingModel="inprocess"'
        Set-Content -Path $webConfigFile -Value $xmlContent
    }
    Write-Host "[1/4] Publish complete." -ForegroundColor Green
} else {
    Write-Host "`n[1/4] Skipping publish build as requested." -ForegroundColor DarkGray
}

# 2. Gather files to upload
$files = Get-ChildItem -Path $PublishDir -Recurse -File | Where-Object {
    $_.FullName -notmatch '\\publish\\' -and
    $_.Name -ne "appsettings.Development.json"
}

$totalFiles = $files.Count
$totalBytes = ($files | Measure-Object -Property Length -Sum).Sum
$totalMB = [math]::Round($totalBytes / 1MB, 2)

Write-Host "`n[2/4] Prepared $totalFiles files ($totalMB MB) for upload." -ForegroundColor Yellow

# 3. Upload files via FTP using curl
Write-Host "`n[3/4] Uploading to ftp://$Server/$RemoteRoot/ ..." -ForegroundColor Yellow
$curlExe = "C:\Windows\system32\curl.exe"
if (-not (Test-Path $curlExe)) {
    $curlExe = (Get-Command curl.exe).Source
}

# Upload app_offline.htm to safely release IIS file locks
$offlineFile = Join-Path $PSScriptRoot "app_offline.htm"
Set-Content -Path $offlineFile -Value "<h3>Site is deploying updates...</h3>"
Write-Host "  Putting app offline to release IIS DLL locks..." -ForegroundColor Cyan
& $curlExe -s -S -u "${User}:${Pass}" -T "$offlineFile" "ftp://${Server}/${RemoteRoot}/app_offline.htm"
Start-Sleep -Seconds 2

$uploaded = 0
$failed = 0

foreach ($file in $files) {
    $relPath = $file.FullName.Substring($PublishDir.Length + 1).Replace('\', '/')
    $remoteUrl = "ftp://${Server}/${RemoteRoot}/${relPath}"
    
    $uploaded++
    Write-Host "  [$uploaded/$totalFiles] Uploading: $relPath" -ForegroundColor Gray
    
    $result = & $curlExe -s -S --ftp-create-dirs -u "${User}:${Pass}" -T "$($file.FullName)" "$remoteUrl" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to upload ${relPath}: $result"
        $failed++
    }
}

# Remove app_offline.htm to bring app back online
Write-Host "  Removing app_offline.htm to restart IIS worker..." -ForegroundColor Cyan
& $curlExe -s -S -u "${User}:${Pass}" "ftp://${Server}/" -Q "DELE /${RemoteRoot}/app_offline.htm" | Out-Null
Remove-Item -Path $offlineFile -Force -ErrorAction SilentlyContinue

if ($failed -gt 0) {
    Write-Warning "`n[!] Upload completed with $failed failure(s)."
} else {
    Write-Host "`n[3/4] All files uploaded successfully." -ForegroundColor Green
}

# 4. Perform Healthchecks
Write-Host "`n[4/4] Performing Healthchecks on deployed server..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Root Healthcheck
$rootUrl = "https://mybiotwin.runasp.net/"
Write-Host "Checking Root Endpoint: $rootUrl" -ForegroundColor Cyan
try {
    $rootResp = & $curlExe -s -i "$rootUrl"
    Write-Host $rootResp
} catch {
    Write-Warning "Root check failed: $_"
}

Write-Host "`nChecking Detailed Health Check: https://mybiotwin.runasp.net/health" -ForegroundColor Cyan
try {
    $healthResp = & $curlExe -s -i "https://mybiotwin.runasp.net/health"
    Write-Host $healthResp
} catch {
    Write-Warning "Health check failed: $_"
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " Deployment & Healthcheck Process Finished" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
