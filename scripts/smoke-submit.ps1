param(
    [string]$ContractAddress = "0x6F242b0c01F6D0149b9Ff34fda03b857AeD13FDE"
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

$password = $env:GENLAYER_KEYSTORE_PASSWORD
if ([string]::IsNullOrWhiteSpace($password)) {
    $password = "echotrace-local-keystore"
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

    throw "GenLayer CLI not found. Install it with npm, then rerun npm run genlayer:smoke."
}

$GenLayer = Resolve-GenLayerCli

$signals = '[{"sourceType":"social","note":"Repeated launch phrase appeared across several public posts","observedAt":"T+18m","intensity":82},{"sourceType":"forum","note":"Multiple accounts repeated a similar claim within a short window","observedAt":"T+24m","intensity":74},{"sourceType":"community","note":"Only a small number of original explanations were observed","observedAt":"T+35m","intensity":61}]'

& $GenLayer network set testnet-asimov
$password | & $GenLayer write $ContractAddress submit_trace --args "AI agents on-chain" $signals
