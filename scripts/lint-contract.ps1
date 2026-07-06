$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))
genvm-lint lint .\contracts\echotrace.py --json
