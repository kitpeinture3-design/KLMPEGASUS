# Guide Architecture Complète - KLM Pegasus

## 🏗️ Architecture du Projet

### Structure Générale
```
klm-pegasus-complete/
├── frontend/                    # Interface React (Port 5173)
│   ├── src/
│   │   ├── components/         # Composants UI
│   │   │   ├── Auth/          # Login/Register
│   │   │   ├── ui/            # Composants de base
│   │   │   ├── Header.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AIGenerator.jsx
│   │   │   └── UserProfile.jsx
│   │   ├── contexts/          # Gestion d'état
│   │   │   └── AuthContext.jsx
│   │   └── App.jsx
│   └── package.json
│
├── backend/                     # API Node.js (Port 3000)
│   ├── src/
│   │   ├── routes/            # Routes API
│   │   ├── models/            # Modèles de données
│   │   ├── middleware/        # Middlewares
│   │   ├── controllers/       # Logique métier
│   │   └── config/            # Configuration
│   ├── prisma/                # Base de données
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
├── admin-panel/                 # Panel d'administration (Port 3001)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
└── docker-compose.yml          # Orchestration complète
```

## 🚀 Déploiement et Installation

### 1. Frontend (Déjà créé)
**Emplacement actuel :** `/home/ubuntu/klm-pegasus-frontend/`
**Port :** 5173
**Status :** ✅ Fonctionnel

### 2. Backend à créer
**Emplacement :** `/home/ubuntu/klm-pegasus-backend/`
**Port :** 3000
**Technologies :** Node.js + Express + Prisma + PostgreSQL

### 3. Panel Admin à créer
**Emplacement :** `/home/ubuntu/klm-pegasus-admin/`
**Port :** 3001
**Technologies :** React + Recharts pour analytics

### 4. Base de données
**Type :** PostgreSQL
**Port :** 5432
**Interface :** Prisma Studio (Port 5555)

## 📊 Base de Données - Schéma

### Tables Principales

#### Users
```sql
- id (UUID, Primary Key)
- email (String, Unique)
- password (String, Hashed)
- firstName (String)
- lastName (String)
- businessName (String)
- industry (String)
- phone (String, Optional)
- website (String, Optional)
- avatar (String, Optional)
- role (Enum: USER, ADMIN)
- isActive (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Sites
```sql
- id (UUID, Primary Key)
- userId (UUID, Foreign Key)
- name (String)
- domain (String, Unique)
- status (Enum: DRAFT, PUBLISHED, ARCHIVED)
- template (String)
- config (JSON)
- analytics (JSON)
- createdAt (DateTime)
- updatedAt (DateTime)
```

#### Orders
```sql
- id (UUID, Primary Key)
- siteId (UUID, Foreign Key)
- customerEmail (String)
- amount (Decimal)
- status (Enum: PENDING, PAID, CANCELLED)
- stripePaymentId (String)
- createdAt (DateTime)
```

## 🔧 APIs Backend

### Authentification
```
POST /api/auth/register     # Inscription
POST /api/auth/login        # Connexion
POST /api/auth/logout       # Déconnexion
GET  /api/auth/me          # Profil utilisateur
PUT  /api/auth/profile     # Mise à jour profil
```

### Sites
```
GET    /api/sites          # Liste des sites
POST   /api/sites          # Créer un site
GET    /api/sites/:id      # Détails d'un site
PUT    /api/sites/:id      # Modifier un site
DELETE /api/sites/:id      # Supprimer un site
```

### IA
```
POST /api/ai/generate-site     # Générer un site
POST /api/ai/generate-content  # Générer du contenu
POST /api/ai/analyze          # Analyser la concurrence
```

### Admin
```
GET /api/admin/users          # Liste des utilisateurs
GET /api/admin/analytics      # Analytics globales
GET /api/admin/sites          # Tous les sites
```

## 🛠️ Instructions de Déploiement

### Étape 1: Créer le Backend
```bash
# Aller dans le dossier du projet original
cd /home/ubuntu/KLMPEGASUS/backend

# Copier vers le nouveau dossier
cp -r . /home/ubuntu/klm-pegasus-backend/

# Installer les dépendances
cd /home/ubuntu/klm-pegasus-backend
npm install

# Configurer la base de données
npx prisma migrate dev
npx prisma generate
```

### Étape 2: Créer le Panel Admin
```bash
# Créer l'application admin
cd /home/ubuntu
manus-create-react-app klm-pegasus-admin

# Configurer pour l'administration
cd klm-pegasus-admin
# Ajouter les composants d'administration
```

### Étape 3: Configuration Docker
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

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/klm_pegasus
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"

  admin:
    build: ./admin-panel
    ports:
      - "3001:3001"

volumes:
  postgres_data:
```

### Étape 4: Variables d'Environnement
```env
# .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/klm_pegasus"
JWT_SECRET="votre-secret-jwt-super-securise"
OPENAI_API_KEY="sk-votre-cle-openai"
STRIPE_SECRET_KEY="sk_test_votre-cle-secrete"
FRONTEND_URL="http://localhost:5173"
ADMIN_URL="http://localhost:3001"
```

## 🔍 Interface d'Administration

### Fonctionnalités du Panel Admin
1. **Dashboard Analytics**
   - Nombre d'utilisateurs total
   - Sites créés par jour/mois
   - Revenus générés
   - Taux de conversion

2. **Gestion des Utilisateurs**
   - Liste complète des utilisateurs
   - Détails de chaque utilisateur
   - Activation/Désactivation de comptes
   - Historique des connexions

3. **Gestion des Sites**
   - Tous les sites créés
   - Statuts des sites
   - Performances par site
   - Modération du contenu

4. **Analytics Avancées**
   - Graphiques de croissance
   - Métriques de performance
   - Rapports d'utilisation
   - Logs système

## 📱 Accès aux Interfaces

### Frontend Utilisateur
- **URL :** http://localhost:5173
- **Fonctionnalités :** Login, Dashboard, Générateur IA, Profil

### Backend API
- **URL :** http://localhost:3000
- **Documentation :** http://localhost:3000/docs (Swagger)

### Panel Administration
- **URL :** http://localhost:3001
- **Accès :** Réservé aux administrateurs

### Base de Données
- **Prisma Studio :** http://localhost:5555
- **PostgreSQL :** localhost:5432

## 🔐 Sécurité et Authentification

### JWT Tokens
- Expiration : 24 heures
- Refresh tokens : 7 jours
- Stockage : localStorage (frontend)

### Rôles et Permissions
- **USER :** Accès frontend uniquement
- **ADMIN :** Accès frontend + panel admin

### Protection des Routes
- Middleware d'authentification
- Validation des tokens
- Rate limiting sur les APIs

## 📊 Monitoring et Logs

### Logs Backend
```bash
# Voir les logs en temps réel
tail -f /var/log/klm-pegasus/app.log

# Logs Docker
docker-compose logs -f backend
```

### Métriques de Performance
- Temps de réponse API
- Utilisation mémoire/CPU
- Nombre de requêtes par minute
- Erreurs et exceptions

## 🚀 Commandes de Démarrage

### Développement
```bash
# Frontend
cd klm-pegasus-frontend && npm run dev

# Backend
cd klm-pegasus-backend && npm run dev

# Admin Panel
cd klm-pegasus-admin && npm run dev

# Base de données
docker run -d -p 5432:5432 -e POSTGRES_DB=klm_pegasus postgres:15
```

### Production
```bash
# Tout démarrer avec Docker
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f
```

## 📋 Checklist de Déploiement

- [ ] Frontend fonctionnel (✅ Fait)
- [ ] Backend avec API complète
- [ ] Base de données PostgreSQL
- [ ] Panel d'administration
- [ ] Authentification JWT
- [ ] Gestion des utilisateurs
- [ ] Analytics et monitoring
- [ ] Documentation API
- [ ] Tests automatisés
- [ ] Déploiement Docker

## 🎯 Prochaines Étapes

1. **Créer le backend complet**
2. **Configurer la base de données**
3. **Développer le panel admin**
4. **Connecter frontend au backend**
5. **Tester l'ensemble du système**
6. **Déployer en production**

Cette architecture vous donne un contrôle total sur votre plateforme KLM Pegasus avec une interface utilisateur élégante et un système d'administration complet pour superviser tous les aspects de votre application.

