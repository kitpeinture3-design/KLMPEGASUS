#!/bin/bash

# ==============================================
# KLM PEGASUS - SCRIPT D'INSTALLATION AUTOMATIQUE
# ==============================================
# Auteur: Manus AI
# Version: 1.0.0
# Date: 12 Août 2025

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage
print_step() {
    echo -e "${BLUE}[ÉTAPE]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

# Fonction de vérification des prérequis
check_requirements() {
    print_step "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    if [[ $(echo "$NODE_VERSION 18.0.0" | tr " " "\n" | sort -V | head -n1) != "18.0.0" ]]; then
        print_error "Node.js version 18+ requis. Version actuelle: $NODE_VERSION"
        exit 1
    fi
    print_success "Node.js $NODE_VERSION détecté"
    
    # Vérifier Python
    if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
        print_error "Python n'est pas installé. Veuillez l'installer depuis https://www.python.org/"
        exit 1
    fi
    
    PYTHON_CMD="python3"
    if ! command -v python3 &> /dev/null; then
        PYTHON_CMD="python"
    fi
    
    PYTHON_VERSION=$($PYTHON_CMD --version | cut -d' ' -f2)
    if [[ $(echo "$PYTHON_VERSION 3.11.0" | tr " " "\n" | sort -V | head -n1) != "3.11.0" ]]; then
        print_warning "Python 3.11+ recommandé. Version actuelle: $PYTHON_VERSION"
    else
        print_success "Python $PYTHON_VERSION détecté"
    fi
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker n'est pas installé. Installation recommandée pour un déploiement facile."
    else
        print_success "Docker détecté"
    fi
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        print_error "Git n'est pas installé. Veuillez l'installer."
        exit 1
    fi
    print_success "Git détecté"
}

# Installation des dépendances
install_dependencies() {
    print_step "Installation des dépendances..."
    
    # Installation des dépendances racine
    print_step "Installation des dépendances racine..."
    npm install
    
    # Installation des dépendances frontend
    print_step "Installation des dépendances frontend..."
    cd frontend
    npm install
    cd ..
    
    # Installation des dépendances backend
    print_step "Installation des dépendances backend..."
    cd backend
    npm install
    cd ..
    
    # Installation des dépendances AI service
    print_step "Installation des dépendances du service IA..."
    cd ai-service
    
    # Créer un environnement virtuel Python
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        python -m venv venv
        source venv/Scripts/activate
    else
        # Linux/macOS
        python3 -m venv venv
        source venv/bin/activate
    fi
    
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
    
    print_success "Toutes les dépendances ont été installées"
}

# Configuration de l'environnement
setup_environment() {
    print_step "Configuration de l'environnement..."
    
    # Copier le fichier d'environnement
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Fichier .env créé à partir de .env.example"
        print_warning "IMPORTANT: Éditez le fichier .env avec vos clés API avant de continuer"
    else
        print_warning "Le fichier .env existe déjà"
    fi
}

# Configuration de la base de données
setup_database() {
    print_step "Configuration de la base de données..."
    
    # Vérifier si PostgreSQL est installé
    if command -v psql &> /dev/null; then
        print_step "PostgreSQL détecté, création de la base de données..."
        
        # Créer la base de données si elle n'existe pas
        createdb klm_pegasus 2>/dev/null || print_warning "La base de données klm_pegasus existe déjà"
        
        # Appliquer les migrations
        cd backend
        npx prisma generate
        npx prisma migrate dev --name init
        cd ..
        
        print_success "Base de données configurée"
    else
        print_warning "PostgreSQL non détecté. Utilisez Docker ou installez PostgreSQL manuellement."
    fi
}

# Configuration Docker
setup_docker() {
    if command -v docker &> /dev/null; then
        print_step "Configuration Docker..."
        
        # Construire les images Docker
        docker-compose build
        
        print_success "Images Docker construites"
        print_step "Pour démarrer avec Docker, utilisez: docker-compose up -d"
    fi
}

# Tests de vérification
run_tests() {
    print_step "Exécution des tests de vérification..."
    
    # Test backend
    cd backend
    if npm test --silent 2>/dev/null; then
        print_success "Tests backend: OK"
    else
        print_warning "Tests backend: Certains tests ont échoué"
    fi
    cd ..
    
    # Test frontend
    cd frontend
    if npm test -- --watchAll=false --silent 2>/dev/null; then
        print_success "Tests frontend: OK"
    else
        print_warning "Tests frontend: Certains tests ont échoué"
    fi
    cd ..
    
    # Test service IA
    cd ai-service
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
    if python -m pytest --quiet 2>/dev/null; then
        print_success "Tests service IA: OK"
    else
        print_warning "Tests service IA: Certains tests ont échoué"
    fi
    cd ..
}

# Affichage des informations finales
show_final_info() {
    echo ""
    echo "=============================================="
    echo -e "${GREEN}🎉 INSTALLATION TERMINÉE AVEC SUCCÈS ! 🎉${NC}"
    echo "=============================================="
    echo ""
    echo -e "${BLUE}Prochaines étapes:${NC}"
    echo ""
    echo "1. 📝 Éditez le fichier .env avec vos clés API:"
    echo "   - OPENAI_API_KEY (obligatoire)"
    echo "   - STRIPE_SECRET_KEY (pour les paiements)"
    echo "   - AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY (pour les assets)"
    echo ""
    echo "2. 🚀 Démarrez l'application:"
    echo "   Avec Docker (recommandé):"
    echo "   $ docker-compose up -d"
    echo ""
    echo "   Ou en mode développement:"
    echo "   $ npm run dev"
    echo ""
    echo "3. 🌐 Accédez à l'application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:8000"
    echo "   - Service IA: http://localhost:8001"
    echo "   - Documentation API: http://localhost:8000/docs"
    echo ""
    echo "4. 📚 Consultez la documentation:"
    echo "   - README.md"
    echo "   - GUIDE_INSTALLATION.md"
    echo "   - PLANNING_JOUR_PAR_JOUR.md"
    echo ""
    echo -e "${YELLOW}⚠️  N'oubliez pas de configurer vos clés API dans le fichier .env !${NC}"
    echo ""
    echo -e "${GREEN}Bon développement avec KLM Pegasus ! 🚀${NC}"
}

# Fonction principale
main() {
    echo "=============================================="
    echo -e "${BLUE}🚀 KLM PEGASUS - INSTALLATION AUTOMATIQUE 🚀${NC}"
    echo "=============================================="
    echo ""
    echo "Ce script va installer et configurer KLM Pegasus"
    echo "Plateforme E-commerce IA Révolutionnaire"
    echo ""
    
    # Demander confirmation
    read -p "Voulez-vous continuer l'installation ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation annulée."
        exit 0
    fi
    
    # Exécuter les étapes d'installation
    check_requirements
    install_dependencies
    setup_environment
    setup_database
    setup_docker
    run_tests
    show_final_info
}

# Gestion des erreurs
trap 'print_error "Une erreur est survenue. Installation interrompue."; exit 1' ERR

# Exécuter le script principal
main "$@"

