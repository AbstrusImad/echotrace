param(
    [string]$AccountName = "echotrace-bradbury",
    [string]$ContractPath = ".\contracts\echotrace.py"
)

$ErrorActionPreference = "Stop"

function Import-DotEnv {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        throw ".env not found at $Path"
    }

    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }
        $parts = $line.Split("=", 2)
        $name = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")
        if ($name -ne "") {
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

function Resolve-GenLayerCli {
    $candidates = @(
        "C:\Users\mrima\AppData\Roaming\npm\genlayer.cmd",
        "genlayer.cmd",
        "genlayer"
    )

    foreach ($candidate in $candidates) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($command) {
            return $command.Source
        }
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    throw "GenLayer CLI not found. Install it with npm, then rerun npm run deploy:bradbury."
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot
Import-DotEnv (Join-Path $projectRoot ".env")
$GenLayer = Resolve-GenLayerCli

if ([string]::IsNullOrWhiteSpace($env:GENLAYER_PRIVATE_KEY_0)) {
    throw "GENLAYER_PRIVATE_KEY_0 is missing in .env"
}

$password = $env:GENLAYER_KEYSTORE_PASSWORD
if ([string]::IsNullOrWhiteSpace($password)) {
    $password = "echotrace-local-keystore"
}

New-Item -ItemType Directory -Path ".\deployments" -Force | Out-Null

Write-Host "Setting GenLayer network: testnet-bradbury"
& $GenLayer network set testnet-bradbury

Write-Host "Importing deploy account into local GenLayer keystore"
& $GenLayer account import --name $AccountName --private-key $env:GENLAYER_PRIVATE_KEY_0 --password $password --overwrite

Write-Host "Deploying EchoTrace contract to Bradbury"
$password | & $GenLayer deploy --contract $ContractPath | Tee-Object -FilePath ".\deployments\bradbury-latest.txt"

Write-Host "Deployment output saved to deployments\bradbury-latest.txt"
