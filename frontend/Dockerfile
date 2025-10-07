# Dockerfile pour le Frontend Laevitas (React)
# Multi-stage build pour optimiser la taille de l'image

# Stage 1: Build the React application
FROM node:18-alpine AS build

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --silent

# Copier le code source
COPY . .

# Variables d'environnement pour le build
ARG REACT_APP_API_URL=http://localhost:5000/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build de l'application React
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS production

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage précédent
COPY --from=build /app/build /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Variables d'environnement
ENV NODE_ENV=production

# Commande de santé pour Docker
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]