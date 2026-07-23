[CmdletBinding()]
param(
    [switch]$IncludeE2E,
    [switch]$IncludeDependencyAudit
)

$ErrorActionPreference = 'Continue'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$frontRoot = Join-Path $projectRoot 'profdex-front'
$backRoot = Join-Path $projectRoot 'profdex-back'
$results = [System.Collections.Generic.List[object]]::new()

function Invoke-Gate {
    param(
        [Parameter(Mandatory)]
        [string]$Name,
        [Parameter(Mandatory)]
        [string]$WorkingDirectory,
        [Parameter(Mandatory)]
        [string]$Executable,
        [Parameter(Mandatory)]
        [string[]]$Arguments
    )

    Write-Host ""
    Write-Host "== $Name =="
    Push-Location $WorkingDirectory
    try {
        & $Executable @Arguments
        $code = $LASTEXITCODE
    }
    catch {
        Write-Error $_
        $code = 1
    }
    finally {
        Pop-Location
    }

    $results.Add([PSCustomObject]@{
        Gate = $Name
        ExitCode = $code
        Status = if ($code -eq 0) { 'PASS' } else { 'FAIL' }
    })
}

Invoke-Gate -Name 'Frontend Oxlint' -WorkingDirectory $frontRoot -Executable 'npx.cmd' -Arguments @('oxlint', '.')
Invoke-Gate -Name 'Frontend ESLint' -WorkingDirectory $frontRoot -Executable 'npx.cmd' -Arguments @('eslint', '.', '--no-cache')
Invoke-Gate -Name 'Frontend Build' -WorkingDirectory $frontRoot -Executable 'npm.cmd' -Arguments @('run', 'build')
Invoke-Gate -Name 'Backend ESLint' -WorkingDirectory $backRoot -Executable 'npx.cmd' -Arguments @('eslint', '{src,apps,libs,test}/**/*.ts')
Invoke-Gate -Name 'Backend Unit + Coverage' -WorkingDirectory $backRoot -Executable 'npm.cmd' -Arguments @('run', 'test:cov', '--', '--runInBand')
Invoke-Gate -Name 'Backend Build' -WorkingDirectory $backRoot -Executable 'npm.cmd' -Arguments @('run', 'build')

if ($IncludeE2E) {
    Invoke-Gate -Name 'Backend E2E' -WorkingDirectory $backRoot -Executable 'npm.cmd' -Arguments @('run', 'test:e2e', '--', '--runInBand')
}

if ($IncludeDependencyAudit) {
    Invoke-Gate -Name 'Root Dependency Audit' -WorkingDirectory $projectRoot -Executable 'npm.cmd' -Arguments @('audit', '--omit=dev')
    Invoke-Gate -Name 'Frontend Dependency Audit' -WorkingDirectory $frontRoot -Executable 'npm.cmd' -Arguments @('audit', '--omit=dev')
    Invoke-Gate -Name 'Backend Dependency Audit' -WorkingDirectory $backRoot -Executable 'npm.cmd' -Arguments @('audit', '--omit=dev')
}

Write-Host ""
Write-Host '== Resumo =='
$results | Format-Table -AutoSize

if ($results.Where({ $_.Status -eq 'FAIL' }).Count -gt 0) {
    exit 1
}

exit 0
