# Guide d'Installation Complet - KLM Pegasus

**Auteur:** Manus AI  
**Version:** 1.0.0  
**Date:** 12 Août 2025  

---

## 📋 Table des Matières

1. [Prérequis Système](#prérequis-système)
2. [Installation Rapide (5 minutes)](#installation-rapide)
3. [Installation Détaillée](#installation-détaillée)
4. [Configuration](#configuration)
5. [Vérification](#vérification)
6. [Dépannage](#dépannage)
7. [Déploiement](#déploiement)

---

## 🖥️ Prérequis Système

### Configuration Minimale

- **OS :** Windows 10+, macOS 10.15+, ou Linux Ubuntu 18.04+
- **RAM :** 8 GB minimum, 16 GB recommandé
- **Stockage :** 10 GB d'espace libre
- **Processeur :** Intel i5 ou équivalent AMD
- **Connexion Internet :** Requise pour les APIs externes

### Logiciels Requis

#### 1. Node.js et npm

**Windows :**
```bash
# Télécharger depuis https://nodejs.org/
# Installer la version LTS (20.x.x)
# Vérifier l'installation
node --version
npm --version
```

**macOS :**
```bash
# Avec Homebrew
brew install node

# Ou télécharger depuis https://nodejs.org/
```

**Linux (Ubuntu/Debian) :**
```bash
# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

#### 2. Python 3.11+

**Windows :**
```bash
# Télécharger depuis https://www.python.org/
# Cocher "Add Python to PATH" lors de l'installation
python --version
pip --version
```

**macOS :**
```bash
# Avec Homebrew
brew install python@3.11

# Ou avec pyenv
pyenv install 3.11.0
pyenv global 3.11.0
```

**Linux :**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-pip python3.11-venv

# Créer un lien symbolique
sudo ln -sf /usr/bin/python3.11 /usr/bin/python
```

#### 3. Docker et Docker Compose

**Windows :**
```bash
# Télécharger Docker Desktop depuis https://www.docker.com/products/docker-desktop
# Installer et redémarrer
docker --version
docker-compose --version
```

**macOS :**
```bash
# Avec Homebrew
brew install --cask docker

# Ou télécharger Docker Desktop
```

**Linux :**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker

# Démarrer Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### 4. Git

**Windows :**
```bash
# Télécharger depuis https://git-scm.com/
# Installer avec les options par défaut
git --version
```

**macOS :**
```bash
# Préinstallé ou avec Homebrew
brew install git
```

**Linux :**
```bash
sudo apt install git
```

#### 5. Visual Studio Code (Recommandé)

```bash
# Télécharger depuis https://code.visualstudio.com/
# Installer les extensions recommandées :
# - ESLint
# - Prettier
# - Python
# - Docker
# - Prisma
# - Tailwind CSS IntelliSense
```

---

## ⚡ Installation Rapide (5 minutes)

### Étape 1 : Cloner le Projet

```bash
# Cloner le repository
git clone https://github.com/votre-username/klm-pegasus.git
cd klm-pegasus

# Ou télécharger le ZIP et extraire
```

### Étape 2 : Installation Automatique

```bash
# Script d'installation automatique (Linux/macOS)
chmod +x install.sh
./install.sh

# Ou manuellement
npm run install:all
```

### Étape 3 : Configuration Rapide

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer avec vos clés API (voir section Configuration)
nano .env  # ou votre éditeur préféré
```

### Étape 4 : Lancement avec Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Attendre que tous les services soient prêts (2-3 minutes)
docker-compose logs -f
```

### Étape 5 : Initialisation de la Base de Données

```bash
# Appliquer les migrations
npm run db:migrate

# (Optionnel) Ajouter des données de test
npm run db:seed
```

### Étape 6 : Accès à l'Application

- **Frontend :** http://localhost:3000
- **Backend API :** http://localhost:8000
- **Service IA :** http://localhost:8001
- **Documentation API :** http://localhost:8000/docs

---

## 🔧 Installation Détaillée

### Étape 1 : Préparation de l'Environnement

#### Créer le Dossier de Projet

```bash
# Créer un dossier dédié
mkdir ~/projets/klm-pegasus
cd ~/projets/klm-pegasus

# Cloner le projet
git clone https://github.com/votre-username/klm-pegasus.git .
```

#### Vérifier les Prérequis

```bash
# Script de vérification
./scripts/check-requirements.sh

# Ou manuellement
node --version    # Doit être >= 18.0.0
python --version  # Doit être >= 3.11.0
docker --version  # Doit être >= 20.0.0
git --version     # N'importe quelle version récente
```

### Étape 2 : Installation du Backend

```bash
cd backend

# Installer les dépendances
npm install

# Installer les dépendances de développement
npm install --save-dev

# Vérifier l'installation
npm list
```

#### Configuration Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Créer la base de données (si elle n'existe pas)
createdb klm_pegasus

# Appliquer les migrations
npx prisma migrate dev --name init

# Vérifier la base de données
npx prisma studio
```

### Étape 3 : Installation du Frontend

```bash
cd ../frontend

# Installer les dépendances
npm install

# Installer Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Vérifier l'installation
npm list
```

#### Configuration Tailwind

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#F8FAFC',
        accent: '#10B981'
      }
    },
  },
  plugins: [],
}
```

### Étape 4 : Installation du Service IA

```bash
cd ../ai-service

# Créer un environnement virtuel Python
python -m venv venv

# Activer l'environnement virtuel
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Vérifier l'installation
pip list
```

#### Installation des Dépendances Système (Linux)

```bash
# Pour le traitement d'images
sudo apt install python3-dev libjpeg-dev zlib1g-dev

# Pour le scraping web
sudo apt install chromium-browser chromium-chromedriver

# Pour les bases de données vectorielles
sudo apt install build-essential
```

### Étape 5 : Configuration Docker

```bash
cd ..

# Construire les images Docker
docker-compose build

# Vérifier les images
docker images | grep klm-pegasus
```

#### Configuration Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: klm_pegasus
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/klm_pegasus
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000

  ai-service:
    build: ./ai-service
    ports:
      - "8001:8001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}

volumes:
  postgres_data:
```

---

## ⚙️ Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```env
# ======================
# BASE DE DONNÉES
# ======================
DATABASE_URL="postgresql://postgres:password@localhost:5432/klm_pegasus"
REDIS_URL="redis://localhost:6379"

# ======================
# AUTHENTIFICATION
# ======================
JWT_SECRET="votre-secret-jwt-super-securise-changez-moi"
JWT_EXPIRES_IN="7d"

# ======================
# OPENAI
# ======================
OPENAI_API_KEY="sk-votre-cle-openai-ici"
OPENAI_API_BASE="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4"

# ======================
# STRIPE
# ======================
STRIPE_PUBLIC_KEY="pk_test_votre-cle-publique-stripe"
STRIPE_SECRET_KEY="sk_test_votre-cle-secrete-stripe"
STRIPE_WEBHOOK_SECRET="whsec_votre-secret-webhook-stripe"

# ======================
# AWS S3
# ======================
AWS_ACCESS_KEY_ID="votre-access-key-aws"
AWS_SECRET_ACCESS_KEY="votre-secret-key-aws"
AWS_S3_BUCKET="klm-pegasus-assets"
AWS_REGION="eu-west-1"

# ======================
# EMAIL (SENDGRID)
# ======================
SENDGRID_API_KEY="SG.votre-cle-sendgrid"
FROM_EMAIL="noreply@klmpegasus.com"
FROM_NAME="KLM Pegasus"

# ======================
# URLS
# ======================
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"
AI_SERVICE_URL="http://localhost:8001"

# ======================
# SÉCURITÉ
# ======================
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ======================
# MONITORING
# ======================
SENTRY_DSN="votre-dsn-sentry"
LOG_LEVEL="info"

# ======================
# DÉVELOPPEMENT
# ======================
NODE_ENV="development"
DEBUG="klm:*"
```

### Configuration des Services Externes

#### 1. OpenAI API

```bash
# Créer un compte sur https://platform.openai.com/
# Générer une clé API
# Ajouter des crédits à votre compte
# Tester la clé :

curl -H "Authorization: Bearer sk-votre-cle" \
     https://api.openai.com/v1/models
```

#### 2. Stripe

```bash
# Créer un compte sur https://stripe.com/
# Récupérer les clés de test
# Configurer les webhooks :
# URL : http://localhost:8000/api/webhooks/stripe
# Événements : payment_intent.succeeded, customer.subscription.created
```

#### 3. AWS S3

```bash
# Créer un bucket S3
aws s3 mb s3://klm-pegasus-assets

# Configurer les permissions CORS
aws s3api put-bucket-cors --bucket klm-pegasus-assets --cors-configuration file://cors.json
```

#### 4. SendGrid

```bash
# Créer un compte sur https://sendgrid.com/
# Générer une clé API
# Vérifier votre domaine d'envoi
# Tester l'envoi :

curl -X "POST" "https://api.sendgrid.com/v3/mail/send" \
     -H "Authorization: Bearer SG.votre-cle" \
     -H "Content-Type: application/json" \
     -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"noreply@klmpegasus.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test email"}]}'
```

---

## ✅ Vérification

### Tests de Fonctionnement

#### 1. Vérifier les Services

```bash
# Vérifier que tous les services sont démarrés
docker-compose ps

# Tester les endpoints de santé
curl http://localhost:8000/health
curl http://localhost:8001/health

# Vérifier les logs
docker-compose logs backend
docker-compose logs ai-service
```

#### 2. Tests Automatisés

```bash
# Tests backend
cd backend
npm test

# Tests frontend
cd ../frontend
npm test

# Tests service IA
cd ../ai-service
pytest
```

#### 3. Test de Bout en Bout

```bash
# Créer un utilisateur de test
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "businessName": "Test Business",
    "industry": "Mode & Vêtements"
  }'

# Se connecter
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Générer un site (avec le token reçu)
curl -X POST http://localhost:8001/generate-site \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "businessName": "Ma Boutique Test",
    "industry": "Mode & Vêtements",
    "description": "Une boutique de test",
    "targetAudience": "Jeunes adultes"
  }'
```

---

## 🔧 Dépannage

### Problèmes Courants

#### 1. Erreur de Port Déjà Utilisé

```bash
# Vérifier les ports utilisés
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000
netstat -tulpn | grep :8001

# Tuer les processus si nécessaire
sudo kill -9 $(lsof -t -i:3000)
sudo kill -9 $(lsof -t -i:8000)
sudo kill -9 $(lsof -t -i:8001)
```

#### 2. Problème de Base de Données

```bash
# Vérifier que PostgreSQL est démarré
sudo service postgresql status

# Redémarrer PostgreSQL
sudo service postgresql restart

# Vérifier la connexion
psql -h localhost -U postgres -d klm_pegasus

# Recréer la base de données si nécessaire
dropdb klm_pegasus
createdb klm_pegasus
cd backend && npx prisma migrate dev
```

#### 3. Erreur OpenAI API

```bash
# Vérifier la clé API
echo $OPENAI_API_KEY

# Tester la connexion
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Vérifier les crédits
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/usage
```

#### 4. Problème Docker

```bash
# Nettoyer Docker
docker system prune -a

# Reconstruire les images
docker-compose build --no-cache

# Vérifier l'espace disque
df -h
docker system df
```

#### 5. Erreur de Permissions (Linux)

```bash
# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker

# Changer les permissions des fichiers
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh
```

### Logs et Debugging

#### Activer les Logs Détaillés

```bash
# Backend
DEBUG=* npm run dev

# Frontend
REACT_APP_DEBUG=true npm start

# Service IA
LOG_LEVEL=debug python -m uvicorn main:app --reload
```

#### Consulter les Logs

```bash
# Logs Docker
docker-compose logs -f [service-name]

# Logs système
tail -f /var/log/syslog

# Logs application
tail -f logs/app.log
```

---

## 🚀 Déploiement

### Déploiement Local (Production)

```bash
# Build de production
npm run build:all

# Démarrer en mode production
docker-compose -f docker-compose.prod.yml up -d
```

### Déploiement Cloud

#### Vercel (Frontend)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
cd frontend
vercel --prod
```

#### Railway (Backend)

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Déployer
cd backend
railway up
```

#### Heroku (Alternative)

```bash
# Installer Heroku CLI
# Créer une app
heroku create klm-pegasus-backend

# Déployer
git push heroku main
```

### Variables d'Environnement de Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
FRONTEND_URL=https://klmpegasus.com
BACKEND_URL=https://api.klmpegasus.com
```

---

## 📚 Ressources Supplémentaires

### Documentation

- [Documentation API](http://localhost:8000/docs)
- [Guide Utilisateur](./docs/user-guide.md)
- [Architecture Technique](./docs/architecture.md)

### Communauté

- [Discord](https://discord.gg/klmpegasus)
- [GitHub Issues](https://github.com/klm-pegasus/issues)
- [Forum](https://forum.klmpegasus.com)

### Support

- **Email :** support@klmpegasus.com
- **Chat :** Disponible dans l'application
- **Documentation :** https://docs.klmpegasus.com

---

## ✅ Checklist d'Installation

- [ ] Node.js 18+ installé
- [ ] Python 3.11+ installé
- [ ] Docker et Docker Compose installés
- [ ] Git installé
- [ ] Projet cloné
- [ ] Dépendances installées (`npm run install:all`)
- [ ] Fichier `.env` configuré
- [ ] Base de données créée et migrée
- [ ] Services Docker démarrés
- [ ] Tests passent
- [ ] Application accessible sur http://localhost:3000
- [ ] API accessible sur http://localhost:8000
- [ ] Service IA accessible sur http://localhost:8001

---

**Installation terminée avec succès ! 🎉**

Votre plateforme KLM Pegasus est maintenant prête à révolutionner l'e-commerce avec l'intelligence artificielle.

*Guide créé par Manus AI - Version 1.0.0*

