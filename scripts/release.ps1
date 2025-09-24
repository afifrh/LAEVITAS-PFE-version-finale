# Script de création de release pour Laevitas Trading Platform
# Usage: .\scripts\release.ps1 -Version "1.5.0" -Type "minor"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("major", "minor", "patch")]
    [string]$Type = "minor",
    
    [Parameter(Mandatory=$false)]
    [string]$Message = ""
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "🏷️ Création de la release v$Version" -ForegroundColor Green

# Vérifier que nous sommes sur develop
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne "develop") {
    Write-Host "🔄 Basculement vers develop..." -ForegroundColor Yellow
    git checkout develop
}

# Vérifier que develop est à jour
Write-Host "🔄 Mise à jour de develop..." -ForegroundColor Yellow
git pull origin develop 2>$null

# Créer la branche de release
$releaseBranch = "release/$Version"
Write-Host "🌿 Création de la branche $releaseBranch..." -ForegroundColor Cyan
git checkout -b $releaseBranch

# Mettre à jour les versions dans package.json
$files = @(
    "package.json",
    "frontend/package.json",
    "backend/package.json"
)

foreach ($file in $files) {
    $filePath = Join-Path $ProjectRoot $file
    if (Test-Path $filePath) {
        Write-Host "📝 Mise à jour de $file..." -ForegroundColor Cyan
        $content = Get-Content $filePath | ConvertFrom-Json
        $content.version = $Version
        $content | ConvertTo-Json -Depth 10 | Set-Content $filePath
    }
}

# Commit des changements de version
git add .
git commit -m "chore: bump version to $Version"

# Merger vers main
Write-Host "🔄 Merge vers main..." -ForegroundColor Yellow
git checkout main
git merge $releaseBranch --no-ff -m "Release $Version"

# Créer le tag
$tagMessage = if ($Message) { $Message } else { "Release v$Version" }
Write-Host "🏷️ Création du tag v$Version..." -ForegroundColor Cyan
git tag -a "v$Version" -m $tagMessage

# Retourner sur develop et merger
Write-Host "🔄 Retour sur develop..." -ForegroundColor Yellow
git checkout develop
git merge main

# Nettoyer la branche de release
Write-Host "🧹 Suppression de la branche de release..." -ForegroundColor Yellow
git branch -d $releaseBranch

Write-Host "✅ Release v$Version créée avec succès!" -ForegroundColor Green
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. git push origin main" -ForegroundColor White
Write-Host "   2. git push origin develop" -ForegroundColor White
Write-Host "   3. git push origin v$Version" -ForegroundColor White