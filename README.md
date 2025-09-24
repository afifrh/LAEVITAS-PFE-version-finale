# Laevitas Trading Platform

Une plateforme de trading moderne construite avec la stack MERN (MongoDB, Express.js, React, Node.js) avec authentification JWT et gestion des rôles.

## 🚀 Fonctionnalités

- **Authentification JWT** sécurisée
- **Gestion des rôles** : Client et Admin
- **Design moderne** avec thème trading
- **Interface responsive** optimisée pour tous les appareils
- **Dashboard interactif** pour les utilisateurs et administrateurs

## 🛠️ Technologies utilisées

### Backend
- Node.js
- Express.js
- MongoDB avec Mongoose
- JWT pour l'authentification
- bcryptjs pour le hachage des mots de passe
- CORS pour la gestion des requêtes cross-origin

### Frontend
- React 18
- React Router pour la navigation
- Context API pour la gestion d'état
- Axios pour les requêtes HTTP
- CSS moderne avec animations

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd laevitas-trading-platform
```

2. **Installer les dépendances**
```bash
npm run install-all
```

3. **Configuration de l'environnement**
- Créer un fichier `.env` dans le dossier `backend`
- Ajouter vos variables d'environnement (voir backend/.env.example)

4. **Démarrer l'application**
```bash
npm run dev
```

## 🔧 Scripts disponibles

- `npm run dev` - Démarre le serveur et le client en mode développement
- `npm run server` - Démarre uniquement le serveur backend
- `npm run client` - Démarre uniquement le client React
- `npm run build` - Build de production du frontend
- `npm start` - Démarre le serveur en mode production

## 👥 Rôles utilisateurs

### Client
- Accès au dashboard de trading
- Visualisation des données de marché
- Gestion du profil personnel

### Admin
- Toutes les fonctionnalités client
- Gestion des utilisateurs
- Accès aux statistiques avancées
- Configuration de la plateforme

## 🎨 Design

Le design s'inspire des meilleures pratiques des plateformes de trading modernes avec :
- Palette de couleurs professionnelle
- Logo Laevitas intégré
- Interface intuitive et responsive
- Animations fluides

## 📱 Responsive Design

L'application est entièrement responsive et optimisée pour :
- Desktop (1920px+)
- Laptop (1024px+)
- Tablet (768px+)
- Mobile (320px+)

## 🔐 Sécurité

- Authentification JWT avec refresh tokens
- Validation des données côté client et serveur
- Protection contre les attaques CSRF
- Hachage sécurisé des mots de passe
- Middleware de protection des routes

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.