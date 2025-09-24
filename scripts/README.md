# 🚀 Scripts de Release - Laevitas Trading Platform

Ce dossier contient les scripts PowerShell pour automatiser le processus de release et de déploiement de la plateforme Laevitas.

## 📁 Scripts Disponibles

### 1. `release.ps1` - Création de Release
Script pour créer une nouvelle release avec gestion automatique des branches Git.

**Usage:**
```powershell
# Release mineure (1.4.0 → 1.5.0)
.\scripts\release.ps1 -Version "1.5.0" -Type "minor"

# Release majeure (1.4.0 → 2.0.0)
.\scripts\release.ps1 -Version "2.0.0" -Type "major" -Message "Version majeure avec nouvelles fonctionnalités"

# Patch (1.4.0 → 1.4.1)
.\scripts\release.ps1 -Version "1.4.1" -Type "patch"
```

**Ce que fait le script:**
1. Bascule sur la branche `develop`
2. Crée une branche `release/X.X.X`
3. Met à jour les versions dans tous les `package.json`
4. Merge vers `main`
5. Crée un tag Git `vX.X.X`
6. Retourne sur `develop` et merge les changements
7. Nettoie la branche de release

### 2. `deploy.ps1` - Déploiement Complet
Script complet pour déployer l'application avec tests et build.

**Usage:**
```powershell
# Déploiement en développement
.\scripts\deploy.ps1 -Version "1.5.0" -Environment "development"

# Déploiement en production avec tests
.\scripts\deploy.ps1 -Version "1.5.0" -Environment "production"

# Déploiement rapide sans tests ni build
.\scripts\deploy.ps1 -Version "1.5.0" -SkipTests -SkipBuild
```

**Paramètres:**
- `-Version`: Version à déployer (obligatoire)
- `-Environment`: `development`, `staging`, ou `production` (défaut: development)
- `-SkipTests`: Ignorer les tests
- `-SkipBuild`: Ignorer le build

**Ce que fait le script:**
1. Vérifie les prérequis (Node.js, npm, Git)
2. Installe les dépendances
3. Exécute les tests (si non ignorés)
4. Build l'application (si non ignoré)
5. Crée la release Git
6. Déploie selon l'environnement

## 🌿 Structure des Branches Git

```
main (production)
├── develop (développement)
├── release/X.X.X (préparation de release)
├── feature/nom-fonctionnalite (nouvelles fonctionnalités)
└── hotfix/nom-correction (corrections urgentes)
```

### Workflow Git Flow

1. **Développement**: Travail sur `develop`
2. **Nouvelles fonctionnalités**: Branches `feature/*` depuis `develop`
3. **Préparation release**: Branche `release/*` depuis `develop`
4. **Production**: Merge de `release/*` vers `main`
5. **Corrections urgentes**: Branches `hotfix/*` depuis `main`

## 📋 Processus de Release

### 1. Développement d'une nouvelle fonctionnalité
```powershell
# Créer une branche feature
git checkout develop
git checkout -b feature/nouvelle-fonctionnalite

# Développer et commiter
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"

# Merger vers develop
git checkout develop
git merge feature/nouvelle-fonctionnalite
git branch -d feature/nouvelle-fonctionnalite
```

### 2. Création d'une release
```powershell
# Utiliser le script de release
.\scripts\release.ps1 -Version "1.5.0" -Type "minor"

# Ou manuellement
git checkout develop
git checkout -b release/1.5.0
# Mettre à jour les versions
git commit -m "chore: bump version to 1.5.0"
git checkout main
git merge release/1.5.0
git tag -a v1.5.0 -m "Release v1.5.0"
git checkout develop
git merge main
```

### 3. Déploiement
```powershell
# Déploiement automatisé
.\scripts\deploy.ps1 -Version "1.5.0" -Environment "production"
```

### 4. Correction urgente (Hotfix)
```powershell
# Créer un hotfix depuis main
git checkout main
git checkout -b hotfix/1.5.1

# Corriger et commiter
git add .
git commit -m "fix: correction critique"

# Merger vers main et develop
git checkout main
git merge hotfix/1.5.1
git tag -a v1.5.1 -m "Hotfix v1.5.1"
git checkout develop
git merge main
git branch -d hotfix/1.5.1
```

## 🔧 Configuration Requise

### Prérequis
- **Node.js** (v16+)
- **npm** (v8+)
- **Git** (v2.30+)
- **PowerShell** (v5.1+)

### Variables d'environnement
Assurez-vous que les fichiers `.env` sont configurés pour chaque environnement:
- `backend/.env` - Configuration backend
- `frontend/.env` - Configuration frontend

## 📊 Versioning (Semantic Versioning)

Le projet suit le [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Changements incompatibles avec l'API
- **MINOR** (X.Y.0): Nouvelles fonctionnalités compatibles
- **PATCH** (X.Y.Z): Corrections de bugs compatibles

### Exemples
- `1.4.0` → `1.5.0`: Nouvelle fonctionnalité (trading automatisé)
- `1.5.0` → `1.5.1`: Correction de bug
- `1.5.1` → `2.0.0`: Changement majeur (nouvelle API)

## 🚨 Bonnes Pratiques

### Avant une release
- [ ] Tests passent sur toutes les plateformes
- [ ] Documentation mise à jour
- [ ] Changelog mis à jour
- [ ] Variables d'environnement vérifiées
- [ ] Backup de la base de données (production)

### Messages de commit
Utiliser la convention [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Maintenance

### Exemple de workflow complet
```powershell
# 1. Développer une fonctionnalité
git checkout develop
git checkout -b feature/portfolio-analytics
# ... développement ...
git commit -m "feat: add portfolio analytics dashboard"
git checkout develop
git merge feature/portfolio-analytics

# 2. Créer une release
.\scripts\release.ps1 -Version "1.5.0" -Type "minor"

# 3. Déployer
.\scripts\deploy.ps1 -Version "1.5.0" -Environment "production"

# 4. Pousser vers le repository distant
git push origin main
git push origin develop
git push origin v1.5.0
```

## 📞 Support

Pour toute question sur les scripts de release, consultez:
- [RELEASE_PLAN.md](../RELEASE_PLAN.md) - Plan détaillé des releases
- [README.md](../README.md) - Documentation principale du projet