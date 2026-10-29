[CmdletBinding()]
param(
    [ValidateSet('start', 'status', 'stop', 'worker')]
    [string]$Action = 'start',
    [switch]$NoBrowser,
    [string]$LogPath,
    [string]$ErrorLogPath
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = $PSScriptRoot
$ScriptPath = Join-Path $ProjectRoot 'start.ps1'
$StatePath = Join-Path $ProjectRoot 'dev-server.state.json'
$BaseUrl = 'http://localhost:3000'
$Port = 3000
$TimeoutSeconds = 60

function Get-Listener {
    @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) |
        Select-Object -First 1
}

function Get-ProcessForPort($Listener) {
    if ($null -eq $Listener) {
        return $null
    }

    Get-CimInstance Win32_Process -Filter "ProcessId = $($Listener.OwningProcess)" -ErrorAction SilentlyContinue
}

function Test-ApplicationHealth {
    try {
        $page = Invoke-WebRequest -Uri "$BaseUrl/" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        if ($page.StatusCode -ne 200) {
            return [pscustomobject]@{ Ready = $false; Message = "Frontend returned HTTP $($page.StatusCode)." }
        }
    } catch {
        return [pscustomobject]@{ Ready = $false; Message = 'Frontend is not responding yet.' }
    }

    try {
        $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -TimeoutSec 3 -ErrorAction Stop
        if ($health.status -ne 'healthy') {
            return [pscustomobject]@{ Ready = $false; Message = 'Backend health endpoint returned an unhealthy response.' }
        }
    } catch {
        $code = $null
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $code = [int]$_.Exception.Response.StatusCode
        }
        if ($code) {
            return [pscustomobject]@{ Ready = $false; Message = "Backend health endpoint returned HTTP $code." }
        }
        return [pscustomobject]@{ Ready = $false; Message = 'Frontend responds, but the backend health endpoint is unavailable.' }
    }

    [pscustomobject]@{ Ready = $true; Message = 'Frontend and backend are healthy.' }
}

function Read-ManagedState {
    if (-not (Test-Path -LiteralPath $StatePath)) {
        return $null
    }

    try {
        $state = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($state.ProcessId)" -ErrorAction SilentlyContinue
        if (-not $process -or $process.Name -notin @('powershell.exe', 'pwsh.exe')) {
            return $null
        }

        $expectedPath = [regex]::Escape($ScriptPath)
        if ($process.CommandLine -notmatch "(?i)$expectedPath" -or $process.CommandLine -notmatch '(?i)-Action\s+worker') {
            return $null
        }

        $startedAt = [datetime]::Parse($state.StartedAtUtc).ToUniversalTime()
        $actualStart = (Get-Process -Id $state.ProcessId -ErrorAction Stop).StartTime.ToUniversalTime()
        if ([math]::Abs(($actualStart - $startedAt).TotalSeconds) -gt 3) {
            return $null
        }

        [pscustomobject]@{
            ProcessId = [int]$state.ProcessId
            StartedAtUtc = $state.StartedAtUtc
            LogPath = $state.LogPath
            ErrorLogPath = $state.ErrorLogPath
        }
    } catch {
        $null
    }
}

function Write-ManagedState($Process, $LogPath, $ErrorLogPath) {
    $state = [pscustomobject]@{
        ProcessId = $Process.Id
        StartedAtUtc = $Process.StartTime.ToUniversalTime().ToString('o')
        LogPath = $LogPath
        ErrorLogPath = $ErrorLogPath
    }
    $temporaryPath = "$StatePath.tmp"
    $state | ConvertTo-Json | Set-Content -LiteralPath $temporaryPath -Encoding UTF8
    Move-Item -LiteralPath $temporaryPath -Destination $StatePath -Force
}

function Wait-ForHealthyApplication {
    param([int]$Seconds)

    $deadline = (Get-Date).AddSeconds($Seconds)
    do {
        $health = Test-ApplicationHealth
        if ($health.Ready) {
            return $health
        }
        if (-not (Get-Listener) -and -not (Read-ManagedState)) {
            return [pscustomobject]@{ Ready = $false; Message = 'Managed server process exited before the application became healthy.' }
        }
        Start-Sleep -Milliseconds 1000
    } while ((Get-Date) -lt $deadline)

    Test-ApplicationHealth
}

function Show-Status {
    $state = Read-ManagedState
    $listener = Get-Listener
    $health = Test-ApplicationHealth

    Write-Host "Project: $ProjectRoot"
    if ($state) {
        Write-Host "Managed server process: running (PID $($state.ProcessId))"
    } else {
        if (Test-Path -LiteralPath $StatePath) {
            Remove-Item -LiteralPath $StatePath -Force
        }
        Write-Host 'Managed server process: not running'
    }

    if ($listener) {
        $owner = Get-ProcessForPort $listener
        $ownerName = if ($owner) { "$($owner.Name) (PID $($owner.ProcessId))" } else { "PID $($listener.OwningProcess)" }
        Write-Host "Port ${Port}: listening ($ownerName)"
    } else {
        Write-Host "Port ${Port}: not listening"
    }
    Write-Host "Application: $($health.Message)"

    if ($state) {
        Write-Host "Logs: $($state.LogPath)"
        Write-Host "Errors: $($state.ErrorLogPath)"
    }
    if ($health.Ready) {
        Write-Host "URL: $BaseUrl"
        return 0
    }
    if ($listener -and -not $state) {
        Write-Host 'The listener is not owned by this launcher; it will not be stopped automatically.'
    }
    return 1
}

function Stop-ManagedServer {
    $state = Read-ManagedState
    if (-not $state) {
        if (Test-Path -LiteralPath $StatePath) {
            Remove-Item -LiteralPath $StatePath -Force
        }
        Write-Host 'No running server managed by this project was found. No processes were stopped.'
        return 1
    }

    $allProcesses = @(Get-CimInstance Win32_Process)
    $processIds = @([int]$state.ProcessId)
    $depths = @{ ([int]$state.ProcessId) = 0 }
    $changed = $true
    while ($changed) {
        $changed = $false
        foreach ($process in $allProcesses) {
            $parentId = [int]$process.ParentProcessId
            if ($depths.ContainsKey($parentId) -and -not $depths.ContainsKey([int]$process.ProcessId)) {
                $depths[[int]$process.ProcessId] = $depths[$parentId] + 1
                $processIds += [int]$process.ProcessId
                $changed = $true
            }
        }
    }

    foreach ($processId in ($processIds | Sort-Object { $depths[$_] } -Descending)) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
        } catch {
            if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
                Write-Error "Could not stop managed process PID ${processId}: $($_.Exception.Message). The managed state was retained; retry with start.cmd stop."
                return 1
            }
        }
    }
    Remove-Item -LiteralPath $StatePath -Force -ErrorAction SilentlyContinue
    Write-Host 'Stopped only the launcher process and its child processes.'
    return 0
}

if ($Action -eq 'worker') {
    if (-not $LogPath -or -not $ErrorLogPath) {
        Write-Error 'The managed worker requires output and error log paths.'
        exit 1
    }
    Set-Location -LiteralPath $ProjectRoot
    Add-Content -LiteralPath $LogPath -Value "[$(Get-Date -Format o)] Starting npm.cmd run dev from $ProjectRoot"
    $command = "npm.cmd run dev >> `"$LogPath`" 2>> `"$ErrorLogPath`""
    & $env:ComSpec /d /c $command
    $workerExitCode = $LASTEXITCODE
    Add-Content -LiteralPath $LogPath -Value "[$(Get-Date -Format o)] Development server exited with code $workerExitCode"
    exit $workerExitCode
}

Set-Location -LiteralPath $ProjectRoot

if ($Action -eq 'status') {
    exit (Show-Status)
}
if ($Action -eq 'stop') {
    exit (Stop-ManagedServer)
}

foreach ($requiredFile in @(
    'package.json',
    'vite.config.ts',
    'server\src\index.ts',
    'client\index.html',
    'node_modules\.bin\vite.cmd',
    'node_modules\.bin\tsx.cmd',
    'node_modules\.bin\concurrently.cmd'
)) {
    if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot $requiredFile))) {
        Write-Error "Required project file or dependency is missing: $requiredFile. Install dependencies with npm.cmd install, then retry."
        exit 1
    }
}
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue) -or -not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    Write-Error 'Node.js and npm.cmd must be available in PATH.'
    exit 1
}

$listener = Get-Listener
$health = Test-ApplicationHealth
if ($listener -and $health.Ready) {
    Write-Host "Griha Saathi is already healthy at $BaseUrl; reusing the existing server."
    $state = Read-ManagedState
    if ($state) {
        Write-Host "Managed process: PID $($state.ProcessId)"
        Write-Host "Logs: $($state.LogPath)"
    } else {
        Write-Host 'This healthy server was started outside the project launcher; its process will not be managed or stopped here.'
    }
    if (-not $NoBrowser) {
        Start-Process $BaseUrl
    }
    exit 0
}
if ($listener) {
    $owner = Get-ProcessForPort $listener
    $ownerName = if ($owner) { "$($owner.Name) (PID $($owner.ProcessId))" } else { "PID $($listener.OwningProcess)" }
    Write-Error "Port $Port is occupied by $ownerName, but Griha Saathi is not healthy ($($health.Message)). No process was stopped. Stop the conflicting application yourself or choose the correct service."
    exit 1
}

$state = Read-ManagedState
if ($state) {
    Write-Host "A managed server process (PID $($state.ProcessId)) already exists; waiting for its health check."
    $logPath = $state.LogPath
    $errorLogPath = $state.ErrorLogPath
} else {
    if (Test-Path -LiteralPath $StatePath) {
        Remove-Item -LiteralPath $StatePath -Force
    }

    $logsDirectory = Join-Path $ProjectRoot 'logs'
    New-Item -ItemType Directory -Path $logsDirectory -Force | Out-Null
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $logPath = Join-Path $logsDirectory "dev-server-$stamp.log"
    $errorLogPath = Join-Path $logsDirectory "dev-server-$stamp-error.log"
    New-Item -ItemType File -Path $logPath -Force | Out-Null
    New-Item -ItemType File -Path $errorLogPath -Force | Out-Null
    $powershellPath = (Get-Command powershell.exe -ErrorAction Stop).Source
    $workerArguments = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -Action worker -LogPath `"$logPath`" -ErrorLogPath `"$errorLogPath`""
    try {
        $worker = Start-Process -FilePath $powershellPath -ArgumentList $workerArguments `
            -WorkingDirectory $ProjectRoot -WindowStyle Minimized -PassThru
        Write-ManagedState $worker $logPath $errorLogPath
    } catch {
        Write-Error "Could not start the independent development server: $($_.Exception.Message)"
        exit 1
    }
    Write-Host "Started independent server process (PID $($worker.Id))."
}

Write-Host "Waiting up to $TimeoutSeconds seconds for the frontend and backend at $BaseUrl ..."
$health = Wait-ForHealthyApplication -Seconds $TimeoutSeconds
if (-not $health.Ready) {
    $listener = Get-Listener
    if ($listener) {
        $owner = Get-ProcessForPort $listener
        $ownerName = if ($owner) { "$($owner.Name) (PID $($owner.ProcessId))" } else { "PID $($listener.OwningProcess)" }
        Write-Error "Startup did not become healthy: $($health.Message) Port $Port is owned by $ownerName. No process was killed."
    } elseif ($health.Message -like 'Managed server process exited*') {
        Write-Error "Startup failed: $($health.Message) Review the logs at $logPath and $errorLogPath. Check status with start.cmd status."
    } else {
        Write-Error "Startup timed out: $($health.Message) Review the logs at $logPath and $errorLogPath. Check status with start.cmd status; stop with start.cmd stop."
    }
    exit 1
}

Write-Host "Griha Saathi is ready at $BaseUrl"
Write-Host "Process: PID $((Read-ManagedState).ProcessId)"
Write-Host "Logs: $logPath"
Write-Host "Errors: $errorLogPath"
Write-Host 'Status: start.cmd status    Stop: start.cmd stop'
if (-not $NoBrowser) {
    try {
        Start-Process $BaseUrl
    } catch {
        Write-Error "The server is healthy, but the browser could not be opened: $($_.Exception.Message)"
        exit 1
    }
}
exit 0
