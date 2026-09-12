$ErrorActionPreference = 'Stop'
$installer = Join-Path $PSScriptRoot 'scripts/install_harness.py'
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    throw 'Install uv first, or use Python 3.12+ with PyYAML to run scripts/install_harness.py.'
}
& uv run --script $installer @args
exit $LASTEXITCODE
