# Copia a versao mais recente do plugin para a pasta de Plugins do Roblox Studio.
# O Studio recarrega plugins locais automaticamente quando o ficheiro muda,
# por isso basta correr este script -> nao e preciso reiniciar o Studio/place.
#
# Uso: clica com o botao direito -> "Run with PowerShell"
#      ou no terminal:  powershell -ExecutionPolicy Bypass -File install.ps1

$ErrorActionPreference = "Stop"

$Source = Join-Path $PSScriptRoot "FigmaImageFixer.server.lua"
$PluginsDir = Join-Path $env:LOCALAPPDATA "Roblox\Plugins"
$Dest = Join-Path $PluginsDir "FigmaImageFixer.lua"

if (-not (Test-Path $PluginsDir)) {
    New-Item -ItemType Directory -Force -Path $PluginsDir | Out-Null
}

Copy-Item -Path $Source -Destination $Dest -Force

Write-Host "Plugin copiado para:" $Dest -ForegroundColor Green
Write-Host "O Studio deve recarregar o plugin automaticamente (sem reiniciar)." -ForegroundColor Green
