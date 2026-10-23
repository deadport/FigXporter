# Copia o plugin FigXporter .rbxmx para a pasta de Plugins do Roblox Studio.
# O Studio recarrega plugins locais automaticamente quando o ficheiro muda,
# por isso basta correr este script -> nao e preciso reiniciar o Studio/place.
#
# Uso: clica com o botao direito -> "Run with PowerShell"
#      ou no terminal:  powershell -ExecutionPolicy Bypass -File install.ps1

$ErrorActionPreference = "Stop"

$Source = Join-Path $PSScriptRoot "FigXporter.rbxmx"
$PluginsDir = Join-Path $env:LOCALAPPDATA "Roblox\Plugins"
$Dest = Join-Path $PluginsDir "FigXporter.rbxmx"

if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) {
    throw "Plugin package not found: $Source. Run npm run build:studio-plugin first."
}

if (-not (Test-Path $PluginsDir)) {
    New-Item -ItemType Directory -Force -Path $PluginsDir | Out-Null
}

Copy-Item -Path $Source -Destination $Dest -Force

Write-Host "FigXporter local plugin copied to:" $Dest -ForegroundColor Green
Write-Host "Restart Roblox Studio or reload the local plugin." -ForegroundColor Green
