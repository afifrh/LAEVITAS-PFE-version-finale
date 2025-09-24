# Script de déploiement pour Laevitas Trading Platform
# Usage: .\scripts\deploy.ps1 -Version "1.5.0" -Environment "production"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false
)

# Configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$FrontendPath = Join-Path $ProjectRoot "frontend"
$BackendPath = Join-Path $ProjectRoot "backend"

Write-Host "🚀 Déploiement de Laevitas Trading Platform v$Version" -ForegroundColor Green
Write-Host "📁 Répertoire: $ProjectRoot" -ForegroundColor Cyan
Write-Host "🌍 Environnement: $Environment" -ForegroundColor Cyan

# Fonction pour vérifier les prérequis
function Test-Prerequisites {
    Write-Host "🔍 Vérification des prérequis..." -ForegroundColor Yellow
    
    # Vérifier Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Error "❌ Node.js n'est pas installé"
        exit 1
    }
    
    # Vérifier npm
    try {
        $npmVersion = npm --version
        Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Error "❌ npm n'est pas installé"
        exit 1
    }
    
    # Vérifier Git
    try {
        $gitVersion = git --version
        Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
    } catch {
        Write-Error "❌ Git n'est pas installé"
        exit 1
    }
}

# Fonction pour installer les dépendances
function Install-Dependencies {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    
    # Backend
    Write-Host "📦 Installation des dépendances backend..." -ForegroundColor Cyan
    Set-Location $BackendPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Échec de l'installation des dépendances backend"
        exit 1
    }
    
    # Frontend
    Write-Host "📦 Installation des dépendances frontend..." -ForegroundColor Cyan
    Set-Location $FrontendPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Échec de l'installation des dépendances frontend"
        exit 1
    }
    
    Set-Location $ProjectRoot
    Write-Host "✅ Dépendances installées avec succès" -ForegroundColor Green
}

# Fonction pour exécuter les tests
function Invoke-Tests {
    if ($SkipTests) {
        Write-Host "⏭️ Tests ignorés" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🧪 Exécution des tests..." -ForegroundColor Yellow
    
    # Tests backend
    Write-Host "🧪 Tests backend..." -ForegroundColor Cyan
    Set-Location $BackendPath
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.test) {
            npm test
            if ($LASTEXITCODE -ne 0) {
                Write-Error "❌ Échec des tests backend"
                exit 1
            }
        } else {
            Write-Host "⚠️ Aucun script de test défini pour le backend" -ForegroundColor Yellow
        }
    }
    
    # Tests frontend
    Write-Host "🧪 Tests frontend..." -ForegroundColor Cyan
    Set-Location $FrontendPath
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.test) {
            npm test -- --coverage --watchAll=false
            if ($LASTEXITCODE -ne 0) {
                Write-Error "❌ Échec des tests frontend"
                exit 1
            }
        } else {
            Write-Host "⚠️ Aucun script de test défini pour le frontend" -ForegroundColor Yellow
        }
    }
    
    Set-Location $ProjectRoot
    Write-Host "✅ Tests réussis" -ForegroundColor Green
}

# Fonction pour construire l'application
function Build-Application {
    if ($SkipBuild) {
        Write-Host "⏭️ Build ignoré" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🔨 Construction de l'application..." -ForegroundColor Yellow
    
    # Build frontend
    Write-Host "🔨 Build frontend..." -ForegroundColor Cyan
    Set-Location $FrontendPath
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Échec du build frontend"
        exit 1
    }
    
    Set-Location $ProjectRoot
    Write-Host "✅ Application construite avec succès" -ForegroundColor Green
}

# Fonction pour créer une release Git
function New-GitRelease {
    Write-Host "🏷️ Création de la release Git..." -ForegroundColor Yellow
    
    # Vérifier que nous sommes sur develop
    $currentBranch = git rev-parse --abbrev-ref HEAD
    if ($currentBranch -ne "develop") {
        Write-Host "🔄 Basculement vers la branche develop..." -ForegroundColor Cyan
        git checkout develop
    }
    
    # Créer une branche de release
    $releaseBranch = "release/$Version"
    Write-Host "🌿 Création de la branche $releaseBranch..." -ForegroundColor Cyan
    git checkout -b $releaseBranch
    
    # Mettre à jour la version dans package.json
    $packageJsonPath = Join-Path $ProjectRoot "package.json"
    if (Test-Path $packageJsonPath) {
        $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
        $packageJson.version = $Version
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
        
        git add $packageJsonPath
        git commit -m "chore: bump version to $Version"
    }
    
    # Merger vers main si c'est la production
    if ($Environment -eq "production") {
        Write-Host "🔄 Merge vers main pour la production..." -ForegroundColor Cyan
        git checkout main
        git merge $releaseBranch --no-ff -m "Release $Version"
        
        # Créer un tag
        git tag -a "v$Version" -m "Release v$Version"
        
        # Retourner sur develop et merger les changements
        git checkout develop
        git merge main
    }
    
    Write-Host "✅ Release Git créée: v$Version" -ForegroundColor Green
}

# Fonction pour déployer selon l'environnement
function Deploy-ToEnvironment {
    Write-Host "🚀 Déploiement vers $Environment..." -ForegroundColor Yellow
    
    switch ($Environment) {
        "development" {
            Write-Host "🔧 Déploiement en développement..." -ForegroundColor Cyan
            # Démarrer les serveurs de développement
            Write-Host "ℹ️ Pour démarrer en mode développement, utilisez: npm run dev" -ForegroundColor Blue
        }
        "staging" {
            Write-Host "🧪 Déploiement en staging..." -ForegroundColor Cyan
            # Logique de déploiement staging
            Write-Host "ℹ️ Déploiement staging à implémenter" -ForegroundColor Blue
        }
        "production" {
            Write-Host "🌐 Déploiement en production..." -ForegroundColor Cyan
            # Logique de déploiement production
            Write-Host "ℹ️ Déploiement production à implémenter" -ForegroundColor Blue
        }
    }
}

# Fonction principale
function Main {
    try {
        Test-Prerequisites
        Install-Dependencies
        Invoke-Tests
        Build-Application
        New-GitRelease
        Deploy-ToEnvironment
        
        Write-Host "🎉 Déploiement réussi de Laevitas Trading Platform v$Version!" -ForegroundColor Green
        Write-Host "📊 Environnement: $Environment" -ForegroundColor Cyan
        Write-Host "🕒 Terminé à: $(Get-Date)" -ForegroundColor Cyan
        
    } catch {
        Write-Error "❌ Échec du déploiement: $_"
        exit 1
    }
}

# Exécution du script principal
Main