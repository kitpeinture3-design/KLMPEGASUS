# Utiliser Node 20 Alpine
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Installer pnpm globalement
RUN npm install -g pnpm

# Copier uniquement les fichiers nécessaires pour installer les dépendances
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances sans générer de node_modules locaux
RUN pnpm install --frozen-lockfile

# Copier le reste du projet
COPY . .

# Exposer le port de l'application
EXPOSE 5000

# Commande de démarrage
CMD ["npm", "start"]




