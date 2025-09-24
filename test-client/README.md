# 🚀 Laevitas API Test Client

Client de test complet pour l'API Laevitas Trading Platform. Ce client permet de tester facilement toutes les fonctionnalités de votre API de trading crypto.

## 📋 Fonctionnalités

### 🔐 Authentification
- ✅ Inscription d'utilisateurs
- ✅ Connexion/Déconnexion
- ✅ Gestion des tokens (access + refresh)
- ✅ Vérification des tokens
- ✅ Déconnexion globale

### 👤 Gestion des utilisateurs
- ✅ Mise à jour du profil
- ✅ Changement de mot de passe
- ✅ Consultation des informations utilisateur
- ✅ Suppression de compte

### ⚙️ Administration
- ✅ Liste des utilisateurs avec pagination
- ✅ Détails d'un utilisateur
- ✅ Modification du statut utilisateur
- ✅ Modification du rôle utilisateur
- ✅ Suppression d'utilisateur
- ✅ Réinitialisation de mot de passe

## 🛠️ Installation

1. **Cloner ou copier les fichiers** dans le dossier `test-client`

2. **Installer les dépendances** :
   ```bash
   cd test-client
   npm install
   ```

3. **Vérifier que le serveur backend est démarré** :
   ```bash
   # Dans le dossier backend
   npm run dev
   ```

## 🚀 Utilisation

### Exécution des tests automatiques

```bash
# Exécuter tous les tests
npm test

# Ou directement
node examples.js
```

### Tests individuels

```bash
# Exécuter des tests spécifiques
npm run test:individual

# Ou directement
node examples.js --individual
```

### Utilisation programmatique

```javascript
const LaevitasApiClient = require('./LaevitasApiClient');

// Créer une instance du client
const client = new LaevitasApiClient('http://localhost:5000/api');

// Exemple d'utilisation
async function example() {
  try {
    // Vérifier la santé de l'API
    await client.healthCheck();
    
    // S'inscrire
    await client.register({
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@test.com',
      password: 'Password123',
      confirmPassword: 'Password123'
    });
    
    // Afficher les infos utilisateur
    client.showUserInfo();
    
    // Se connecter en tant qu'admin
    await client.login('admin@laevitas.com', 'Admin123!');
    
    // Obtenir la liste des utilisateurs
    const users = await client.getAllUsers();
    console.log('Utilisateurs:', users.data.users.length);
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}
```

## 📖 API Reference

### Constructeur

```javascript
const client = new LaevitasApiClient(baseUrl);
```

- `baseUrl` (optionnel): URL de base de l'API (défaut: `http://localhost:5000/api`)

### Méthodes d'authentification

| Méthode | Description | Paramètres |
|---------|-------------|------------|
| `register(userData)` | Inscription | `{firstName, lastName, email, password, confirmPassword, phone?}` |
| `login(email, password)` | Connexion | `email`, `password` |
| `logout()` | Déconnexion | - |
| `logoutAll()` | Déconnexion globale | - |
| `refreshAccessToken()` | Rafraîchir le token | - |
| `getMe()` | Profil utilisateur | - |
| `verifyToken()` | Vérifier le token | - |

### Méthodes utilisateur

| Méthode | Description | Paramètres |
|---------|-------------|------------|
| `updateProfile(data)` | Mettre à jour le profil | `{firstName?, lastName?, phone?}` |
| `changePassword(current, new, confirm)` | Changer le mot de passe | `currentPassword`, `newPassword`, `confirmPassword` |
| `getUser(userId)` | Obtenir un utilisateur | `userId` |
| `deleteAccount()` | Supprimer son compte | - |

### Méthodes d'administration

| Méthode | Description | Paramètres |
|---------|-------------|------------|
| `getAllUsers(params)` | Liste des utilisateurs | `{page?, limit?, role?, status?, search?}` |
| `getAdminUser(userId)` | Détails utilisateur | `userId` |
| `updateUserStatus(userId, status, reason)` | Modifier le statut | `userId`, `status`, `reason?` |
| `updateUserRole(userId, role)` | Modifier le rôle | `userId`, `role` |
| `deleteUser(userId)` | Supprimer un utilisateur | `userId` |
| `resetUserPassword(userId)` | Réinitialiser le mot de passe | `userId` |

### Méthodes utilitaires

| Méthode | Description |
|---------|-------------|
| `healthCheck()` | Vérifier la santé de l'API |
| `showUserInfo()` | Afficher les infos de l'utilisateur connecté |
| `showCapabilities()` | Afficher l'aide |
| `isAuthenticated()` | Vérifier si connecté |
| `isAdmin()` | Vérifier si admin |

## 🔧 Configuration

### Variables d'environnement

Le client utilise par défaut `http://localhost:5000/api`. Vous pouvez modifier l'URL lors de l'instanciation :

```javascript
const client = new LaevitasApiClient('https://api.laevitas.com/api');
```

### Comptes de test

Le fichier `examples.js` utilise ces comptes de test :

```javascript
const testUsers = {
  client: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@test.com',
    password: 'TestPassword123',
    // ...
  },
  admin: {
    email: 'admin@laevitas.com',
    password: 'Admin123!'
  }
};
```

## 📊 Exemple de sortie

```
🚀 Laevitas API Test Client v1.0.0
=====================================

📋 Fonctionnalités disponibles:

🔐 AUTHENTIFICATION:
  - register(userData)           : Inscription
  - login(email, password)       : Connexion
  - refreshAccessToken()         : Rafraîchir le token
  ...

📊 État actuel:
  - Connecté: ✅
  - Admin: ✅
  - API: http://localhost:5000/api

============================================================
🔸 TEST 1: Vérification de la santé de l'API
============================================================
🚀 GET http://localhost:5000/api/health
📥 Response (200): {
  "message": "Serveur Laevitas Trading API en fonctionnement",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
✅ API opérationnelle
✅ Health Check: RÉUSSI
```

## 🐛 Dépannage

### Erreurs courantes

1. **Erreur de connexion** : Vérifiez que le serveur backend est démarré
2. **Token expiré** : Le client gère automatiquement le rafraîchissement
3. **Permissions insuffisantes** : Vérifiez que vous êtes connecté avec le bon rôle

### Logs détaillés

Le client affiche automatiquement :
- 🚀 Requêtes sortantes
- 📤 Corps des requêtes
- 📥 Réponses de l'API
- ❌ Erreurs détaillées

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités :

1. Modifiez `LaevitasApiClient.js`
2. Ajoutez des tests dans `examples.js`
3. Mettez à jour cette documentation

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

---

**Développé avec ❤️ pour la plateforme Laevitas Trading**