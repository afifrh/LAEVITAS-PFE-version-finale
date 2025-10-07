# Script de configuration CI/CD pour Laevitas Trading Platform
# Usage: .\scripts\setup-cicd.ps1

param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipGitHubSecrets = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipSonarCloud = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipDockerRegistry = $false,
    
    [Parameter(Mandatory=$false)]
    [string]$GitHubOrg = "",
    
    [Parameter(Mandatory=$false)]
    [string]$GitHubRepo = ""
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Configuration du pipeline CI/CD pour Laevitas" -ForegroundColor Green
Write-Host "Repertoire: $ProjectRoot" -ForegroundColor Cyan

# Fonction pour vérifier les prérequis
function Test-Prerequisites {
    Write-Host "Verification des prerequis..." -ForegroundColor Yellow
    
    $prerequisites = @()
    
    # Vérifier Git
    try {
        $gitVersion = git --version
        Write-Host "Git: $gitVersion" -ForegroundColor Green
    } catch {
        $prerequisites += "Git"
        Write-Host "Git n'est pas installe" -ForegroundColor Red
    }
    
    # Vérifier GitHub CLI
    try {
        $ghVersion = gh --version
        Write-Host "GitHub CLI: $($ghVersion[0])" -ForegroundColor Green
    } catch {
        $prerequisites += "GitHub CLI"
        Write-Host "GitHub CLI n'est pas installe" -ForegroundColor Red
    }
    
    # Vérifier Docker
    try {
        $dockerVersion = docker --version
        Write-Host "Docker: $dockerVersion" -ForegroundColor Green
    } catch {
        $prerequisites += "Docker"
        Write-Host "Docker n'est pas installe" -ForegroundColor Red
    }
    
    # Vérifier Node.js
    try {
        $nodeVersion = node --version
        Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        $prerequisites += "Node.js"
        Write-Host "Node.js n'est pas installe" -ForegroundColor Red
    }
    
    if ($prerequisites.Count -gt 0) {
        Write-Host "Prerequis manquants: $($prerequisites -join ', ')" -ForegroundColor Red
        Write-Host "Veuillez installer les outils manquants avant de continuer." -ForegroundColor Yellow
        return $false
    }
    
    return $true
}

# Fonction pour configurer les secrets GitHub
function Set-GitHubSecrets {
    Write-Host "Configuration des secrets GitHub..." -ForegroundColor Yellow
    
    if ($SkipGitHubSecrets) {
        Write-Host "Configuration des secrets GitHub ignoree" -ForegroundColor Yellow
        return
    }
    
    # Vérifier l'authentification GitHub
    try {
        $user = gh auth status 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Vous devez vous authentifier avec GitHub CLI" -ForegroundColor Red
            Write-Host "Executez: gh auth login" -ForegroundColor Yellow
            return
        }
    } catch {
        Write-Host "Erreur lors de la verification de l'authentification GitHub" -ForegroundColor Red
        return
    }
    
    Write-Host "Secrets a configurer manuellement dans GitHub:" -ForegroundColor Cyan
    Write-Host "1. SONAR_TOKEN - Token SonarCloud" -ForegroundColor White
    Write-Host "2. SNYK_TOKEN - Token Snyk (optionnel)" -ForegroundColor White
    Write-Host "3. SLACK_WEBHOOK_URL - Webhook Slack pour notifications (optionnel)" -ForegroundColor White
    Write-Host "4. DOCKER_REGISTRY_TOKEN - Token pour registry Docker prive (optionnel)" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "URL: https://github.com/$GitHubOrg/$GitHubRepo/settings/secrets/actions" -ForegroundColor Cyan
}

# Fonction pour configurer SonarCloud
function Set-SonarCloudConfig {
    Write-Host "Configuration SonarCloud..." -ForegroundColor Yellow
    
    if ($SkipSonarCloud) {
        Write-Host "Configuration SonarCloud ignoree" -ForegroundColor Yellow
        return
    }
    
    $sonarFile = Join-Path $ProjectRoot "sonar-project.properties"
    
    if (Test-Path $sonarFile) {
        Write-Host "Fichier sonar-project.properties trouve" -ForegroundColor Green
        
        # Mettre à jour avec les informations du projet
        if ($GitHubOrg -and $GitHubRepo) {
            $content = Get-Content $sonarFile
            $content = $content -replace "your-organization", $GitHubOrg
            $content = $content -replace "laevitas-trading-platform", "$GitHubOrg-$GitHubRepo"
            Set-Content $sonarFile $content
            Write-Host "Configuration SonarCloud mise a jour" -ForegroundColor Green
        }
    } else {
        Write-Host "Fichier sonar-project.properties non trouve" -ForegroundColor Red
    }
    
    Write-Host "Etapes manuelles pour SonarCloud:" -ForegroundColor Cyan
    Write-Host "1. Creer un compte sur https://sonarcloud.io" -ForegroundColor White
    Write-Host "2. Importer le projet GitHub" -ForegroundColor White
    Write-Host "3. Generer un token et l'ajouter aux secrets GitHub" -ForegroundColor White
}

# Fonction pour configurer le registry Docker
function Set-DockerRegistry {
    Write-Host "Configuration Docker Registry..." -ForegroundColor Yellow
    
    if ($SkipDockerRegistry) {
        Write-Host "Configuration Docker Registry ignoree" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Le pipeline utilise GitHub Container Registry (ghcr.io) par defaut" -ForegroundColor Cyan
    Write-Host "Aucune configuration supplementaire requise" -ForegroundColor Green
    Write-Host "Les permissions sont gerees automatiquement via GITHUB_TOKEN" -ForegroundColor Cyan
}

# Fonction pour valider les workflows
function Test-Workflows {
    Write-Host "Validation des workflows GitHub Actions..." -ForegroundColor Yellow
    
    $workflowsDir = Join-Path $ProjectRoot ".github\workflows"
    
    if (-not (Test-Path $workflowsDir)) {
        Write-Host "Repertoire .github/workflows non trouve" -ForegroundColor Red
        return $false
    }
    
    $workflows = Get-ChildItem $workflowsDir -Filter "*.yml"
    
    foreach ($workflow in $workflows) {
        Write-Host "Validation de $($workflow.Name)..." -ForegroundColor Cyan
        
        # Validation basique de la syntaxe YAML
        try {
            $content = Get-Content $workflow.FullName -Raw
            if ($content -match "name:" -and $content -match "on:" -and $content -match "jobs:") {
                Write-Host "$($workflow.Name) - Syntaxe valide" -ForegroundColor Green
            } else {
                Write-Host "$($workflow.Name) - Structure incomplete" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "$($workflow.Name) - Erreur de lecture" -ForegroundColor Red
        }
    }
    
    return $true
}

# Fonction pour créer les badges README
function Add-ReadmeBadges {
    Write-Host "Ajout des badges au README..." -ForegroundColor Yellow
    
    $readmeFile = Join-Path $ProjectRoot "README.md"
    
    if (-not (Test-Path $readmeFile)) {
        Write-Host "Fichier README.md non trouve" -ForegroundColor Red
        return
    }
    
    $badges = @"
<!-- Badges CI/CD -->
[![CI](https://github.com/$GitHubOrg/$GitHubRepo/workflows/CI%20-%20Tests%20et%20Validation/badge.svg)](https://github.com/$GitHubOrg/$GitHubRepo/actions/workflows/ci.yml)
[![CD](https://github.com/$GitHubOrg/$GitHubRepo/workflows/CD%20-%20Deploiement%20Continu/badge.svg)](https://github.com/$GitHubOrg/$GitHubRepo/actions/workflows/cd.yml)
[![Security](https://github.com/$GitHubOrg/$GitHubRepo/workflows/Security%20-%20Analyse%20et%20Surveillance/badge.svg)](https://github.com/$GitHubOrg/$GitHubRepo/actions/workflows/security.yml)
[![Performance](https://github.com/$GitHubOrg/$GitHubRepo/workflows/Performance%20-%20Tests%20et%20Monitoring/badge.svg)](https://github.com/$GitHubOrg/$GitHubRepo/actions/workflows/performance.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=$GitHubOrg-$GitHubRepo&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=$GitHubOrg-$GitHubRepo)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=$GitHubOrg-$GitHubRepo&metric=coverage)](https://sonarcloud.io/summary/new_code?id=$GitHubOrg-$GitHubRepo)

"@
    
    $content = Get-Content $readmeFile -Raw
    
    # Ajouter les badges au début du README (après le titre principal)
    if ($content -match "^# .+\n") {
        $content = $content -replace "(^# .+\n)", "`$1`n$badges"
        Set-Content $readmeFile $content -NoNewline
        Write-Host "Badges ajoutes au README.md" -ForegroundColor Green
    } else {
        Write-Host "Impossible de trouver le titre principal dans README.md" -ForegroundColor Yellow
    }
}

# Fonction pour créer la documentation CI/CD
function New-CICDDocumentation {
    Write-Host "Creation de la documentation CI/CD..." -ForegroundColor Yellow
    
    $docsDir = Join-Path $ProjectRoot "docs"
    if (-not (Test-Path $docsDir)) {
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
    }
    
    $cicdDocFile = Join-Path $docsDir "CICD.md"
    
    # Créer le contenu de la documentation
    $cicdContent = @"
# Pipeline CI/CD - Laevitas Trading Platform

## Vue d'ensemble

Ce document decrit le pipeline CI/CD mis en place pour Laevitas Trading Platform, utilisant GitHub Actions pour l'automatisation des tests, de la securite, du deploiement et du monitoring.

## Workflows

### 1. CI - Tests et Validation (ci.yml)
Declencheurs: Push sur main/develop, Pull Requests
Objectif: Validation continue du code

### 2. CD - Deploiement Continu (cd.yml)
Declencheurs: Push sur main, Tags de version
Objectif: Deploiement automatise

### 3. Security - Analyse et Surveillance (security.yml)
Declencheurs: Quotidien, Push, Pull Requests
Objectif: Securite continue

### 4. Performance - Tests et Monitoring (performance.yml)
Declencheurs: Quotidien, Push sur main
Objectif: Monitoring des performances

### 5. Release - Creation automatique (release.yml)
Declencheurs: Changement de version, Manuel
Objectif: Gestion des releases

## Configuration

### Secrets GitHub requis

- SONAR_TOKEN: Token SonarCloud (obligatoire)
- SNYK_TOKEN: Token Snyk (optionnel)
- SLACK_WEBHOOK_URL: Webhook Slack (optionnel)

### Variables d'environnement

- NODE_VERSION: Version Node.js (defaut: 18)
- MONGODB_URI: URI MongoDB pour tests
- JWT_SECRET: Secret JWT pour tests

## Support

En cas de probleme avec le pipeline CI/CD :

1. Verifier les logs des workflows GitHub Actions
2. Consulter la documentation des outils utilises
3. Contacter l'equipe DevOps

## Ressources

- GitHub Actions Documentation: https://docs.github.com/en/actions
- SonarCloud Documentation: https://docs.sonarcloud.io/
- Docker Documentation: https://docs.docker.com/
- K6 Documentation: https://k6.io/docs/
"@
    
    Set-Content $cicdDocFile $cicdContent -Encoding UTF8
    Write-Host "Documentation CI/CD creee: docs/CICD.md" -ForegroundColor Green
}

# Fonction principale
function Main {
    Write-Host "Debut de la configuration CI/CD" -ForegroundColor Green
    
    # Vérifier les prérequis
    if (-not (Test-Prerequisites)) {
        Write-Host "Configuration interrompue - Prerequis manquants" -ForegroundColor Red
        exit 1
    }
    
    # Détecter l'organisation et le repo GitHub
    if (-not $GitHubOrg -or -not $GitHubRepo) {
        try {
            $remoteUrl = git remote get-url origin
            if ($remoteUrl -match "github\.com[:/]([^/]+)/([^/]+)\.git") {
                $GitHubOrg = $matches[1]
                $GitHubRepo = $matches[2]
                Write-Host "Detecte: $GitHubOrg/$GitHubRepo" -ForegroundColor Green
            }
        } catch {
            Write-Host "Impossible de detecter l'organisation/repo GitHub" -ForegroundColor Yellow
        }
    }
    
    # Valider les workflows
    if (-not (Test-Workflows)) {
        Write-Host "Erreurs dans les workflows detectees" -ForegroundColor Red
    }
    
    # Configurer les composants
    Set-GitHubSecrets
    Set-SonarCloudConfig
    Set-DockerRegistry
    
    # Ajouter les badges et documentation
    if ($GitHubOrg -and $GitHubRepo) {
        Add-ReadmeBadges
    }
    New-CICDDocumentation
    
    Write-Host "" -ForegroundColor White
    Write-Host "Configuration CI/CD terminee!" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "1. Configurer les secrets GitHub (voir ci-dessus)" -ForegroundColor White
    Write-Host "2. Creer un compte SonarCloud et importer le projet" -ForegroundColor White
    Write-Host "3. Pousser les changements vers GitHub" -ForegroundColor White
    Write-Host "4. Verifier que les workflows s'executent correctement" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "Workflows: https://github.com/$GitHubOrg/$GitHubRepo/actions" -ForegroundColor Cyan
}

# Exécuter le script principal
Main