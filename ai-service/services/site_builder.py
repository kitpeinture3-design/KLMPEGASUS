import asyncio
import aiofiles
import json
import logging
import uuid
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, Template
import markdown
from models.schemas import (
    SiteStructure, 
    BrandingData, 
    AssetData, 
    SiteStatus,
    PageStructure
)

logger = logging.getLogger(__name__)

class SiteBuilder:
    """Service de construction et déploiement de sites statiques"""
    
    def __init__(self):
        self.templates_path = '/app/templates'
        self.output_path = '/tmp/sites'
        self.jinja_env = None
        self.site_statuses = {}  # Cache des statuts de sites
        
        # Templates HTML de base
        self.base_templates = {
            'base': '''<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ page_title }} - {{ site_name }}</title>
    <meta name="description" content="{{ page_description }}">
    <meta name="keywords" content="{{ page_keywords }}">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="{{ favicon_url }}">
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family={{ heading_font|replace(' ', '+') }}:wght@300;400;600;700&family={{ body_font|replace(' ', '+') }}:wght@300;400;500;600&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Custom CSS -->
    <style>
        :root {
            --primary-color: {{ primary_color }};
            --secondary-color: {{ secondary_color }};
            --accent-color: {{ accent_color }};
            --background-color: {{ background_color }};
            --text-color: {{ text_color }};
        }
        
        .font-heading { font-family: '{{ heading_font }}', serif; }
        .font-body { font-family: '{{ body_font }}', sans-serif; }
        
        .btn-primary {
            background-color: var(--primary-color);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
            background-color: var(--accent-color);
            transform: translateY(-2px);
        }
        
        .section-padding {
            padding: 80px 0;
        }
        
        @media (max-width: 768px) {
            .section-padding {
                padding: 40px 0;
            }
        }
    </style>
    
    {% block extra_head %}{% endblock %}
</head>
<body class="font-body" style="color: var(--text-color); background-color: var(--background-color);">
    {% include 'components/header.html' %}
    
    <main>
        {% block content %}{% endblock %}
    </main>
    
    {% include 'components/footer.html' %}
    
    <!-- Scripts -->
    <script>
        // Analytics et tracking
        {% if analytics_id %}
        gtag('config', '{{ analytics_id }}');
        {% endif %}
        
        // Interactions de base
        document.addEventListener('DOMContentLoaded', function() {
            // Smooth scrolling pour les liens d'ancrage
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
            
            // Animation au scroll
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fade-in');
                    }
                });
            }, observerOptions);
            
            document.querySelectorAll('.animate-on-scroll').forEach(el => {
                observer.observe(el);
            });
        });
    </script>
    
    {% block extra_scripts %}{% endblock %}
</body>
</html>''',
            
            'home': '''{% extends "base.html" %}

{% block content %}
<!-- Hero Section -->
<section class="hero-section relative overflow-hidden section-padding" style="background: linear-gradient(135deg, var(--primary-color), var(--accent-color));">
    <div class="container mx-auto px-4 relative z-10">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div class="text-white">
                <h1 class="font-heading text-5xl lg:text-6xl font-bold mb-6 animate-on-scroll">
                    {{ hero_title }}
                </h1>
                <p class="text-xl mb-8 opacity-90 animate-on-scroll">
                    {{ hero_subtitle }}
                </p>
                <div class="flex flex-col sm:flex-row gap-4 animate-on-scroll">
                    <a href="#products" class="btn-primary inline-block text-center">
                        {{ cta_primary }}
                    </a>
                    <a href="#about" class="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300">
                        {{ cta_secondary }}
                    </a>
                </div>
            </div>
            <div class="animate-on-scroll">
                <img src="{{ hero_image }}" alt="{{ hero_image_alt }}" class="w-full h-auto rounded-lg shadow-2xl">
            </div>
        </div>
    </div>
    
    <!-- Decorative elements -->
    <div class="absolute top-0 right-0 w-1/3 h-full opacity-10">
        <div class="w-full h-full bg-white transform rotate-12 translate-x-1/2"></div>
    </div>
</section>

<!-- Features Section -->
<section id="features" class="section-padding">
    <div class="container mx-auto px-4">
        <div class="text-center mb-16">
            <h2 class="font-heading text-4xl font-bold mb-4 animate-on-scroll">
                {{ features_title }}
            </h2>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto animate-on-scroll">
                {{ features_subtitle }}
            </p>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {% for feature in features %}
            <div class="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 animate-on-scroll">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background-color: var(--accent-color);">
                    <img src="{{ feature.icon }}" alt="{{ feature.title }}" class="w-8 h-8">
                </div>
                <h3 class="font-heading text-xl font-semibold mb-3">{{ feature.title }}</h3>
                <p class="text-gray-600">{{ feature.description }}</p>
            </div>
            {% endfor %}
        </div>
    </div>
</section>

<!-- Products Section -->
<section id="products" class="section-padding bg-gray-50">
    <div class="container mx-auto px-4">
        <div class="text-center mb-16">
            <h2 class="font-heading text-4xl font-bold mb-4 animate-on-scroll">
                {{ products_title }}
            </h2>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto animate-on-scroll">
                {{ products_subtitle }}
            </p>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {% for product in products %}
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 animate-on-scroll">
                <img src="{{ product.image }}" alt="{{ product.name }}" class="w-full h-48 object-cover">
                <div class="p-6">
                    <h3 class="font-heading text-xl font-semibold mb-2">{{ product.name }}</h3>
                    <p class="text-gray-600 mb-4">{{ product.description }}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-2xl font-bold" style="color: var(--primary-color);">{{ product.price }}</span>
                        <button class="btn-primary">Acheter</button>
                    </div>
                </div>
            </div>
            {% endfor %}
        </div>
    </div>
</section>

<!-- About Section -->
<section id="about" class="section-padding">
    <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div class="animate-on-scroll">
                <h2 class="font-heading text-4xl font-bold mb-6">{{ about_title }}</h2>
                <p class="text-lg text-gray-600 mb-6">{{ about_description }}</p>
                <div class="grid grid-cols-2 gap-4">
                    {% for value in brand_values %}
                    <div class="flex items-center">
                        <div class="w-3 h-3 rounded-full mr-3" style="background-color: var(--accent-color);"></div>
                        <span class="font-semibold">{{ value }}</span>
                    </div>
                    {% endfor %}
                </div>
            </div>
            <div class="animate-on-scroll">
                <img src="{{ about_image }}" alt="À propos de nous" class="w-full h-auto rounded-lg shadow-lg">
            </div>
        </div>
    </div>
</section>

<!-- Contact Section -->
<section id="contact" class="section-padding" style="background-color: var(--primary-color);">
    <div class="container mx-auto px-4 text-center text-white">
        <h2 class="font-heading text-4xl font-bold mb-6 animate-on-scroll">{{ contact_title }}</h2>
        <p class="text-xl mb-8 opacity-90 animate-on-scroll">{{ contact_subtitle }}</p>
        <a href="mailto:{{ contact_email }}" class="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 inline-block animate-on-scroll">
            Nous Contacter
        </a>
    </div>
</section>
{% endblock %}''',
            
            'header': '''<header class="bg-white shadow-sm sticky top-0 z-50">
    <nav class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
            <div class="flex items-center">
                <img src="{{ logo_url }}" alt="{{ site_name }}" class="h-10 w-auto mr-3">
                <span class="font-heading text-2xl font-bold" style="color: var(--primary-color);">{{ site_name }}</span>
            </div>
            
            <div class="hidden md:flex space-x-8">
                {% for nav_item in navigation %}
                <a href="{{ nav_item.url }}" class="text-gray-700 hover:text-primary font-medium transition-colors duration-300">
                    {{ nav_item.label }}
                </a>
                {% endfor %}
            </div>
            
            <div class="flex items-center space-x-4">
                <a href="#contact" class="btn-primary">Contact</a>
                
                <!-- Mobile menu button -->
                <button class="md:hidden p-2" onclick="toggleMobileMenu()">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        <!-- Mobile menu -->
        <div id="mobile-menu" class="md:hidden hidden mt-4 pb-4">
            {% for nav_item in navigation %}
            <a href="{{ nav_item.url }}" class="block py-2 text-gray-700 hover:text-primary">{{ nav_item.label }}</a>
            {% endfor %}
        </div>
    </nav>
</header>

<script>
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}
</script>''',
            
            'footer': '''<footer class="bg-gray-900 text-white section-padding">
    <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-4 gap-8">
            <div>
                <div class="flex items-center mb-4">
                    <img src="{{ logo_url }}" alt="{{ site_name }}" class="h-8 w-auto mr-2">
                    <span class="font-heading text-xl font-bold">{{ site_name }}</span>
                </div>
                <p class="text-gray-400 mb-4">{{ site_description }}</p>
                <div class="flex space-x-4">
                    {% if social_links %}
                    {% for social in social_links %}
                    <a href="{{ social.url }}" class="text-gray-400 hover:text-white transition-colors duration-300">
                        {{ social.name }}
                    </a>
                    {% endfor %}
                    {% endif %}
                </div>
            </div>
            
            <div>
                <h3 class="font-semibold text-lg mb-4">Navigation</h3>
                <ul class="space-y-2">
                    {% for nav_item in navigation %}
                    <li><a href="{{ nav_item.url }}" class="text-gray-400 hover:text-white transition-colors duration-300">{{ nav_item.label }}</a></li>
                    {% endfor %}
                </ul>
            </div>
            
            <div>
                <h3 class="font-semibold text-lg mb-4">Contact</h3>
                <ul class="space-y-2 text-gray-400">
                    {% if contact_email %}
                    <li>Email: {{ contact_email }}</li>
                    {% endif %}
                    {% if contact_phone %}
                    <li>Téléphone: {{ contact_phone }}</li>
                    {% endif %}
                    {% if contact_address %}
                    <li>Adresse: {{ contact_address }}</li>
                    {% endif %}
                </ul>
            </div>
            
            <div>
                <h3 class="font-semibold text-lg mb-4">Légal</h3>
                <ul class="space-y-2">
                    <li><a href="/mentions-legales" class="text-gray-400 hover:text-white transition-colors duration-300">Mentions légales</a></li>
                    <li><a href="/politique-confidentialite" class="text-gray-400 hover:text-white transition-colors duration-300">Politique de confidentialité</a></li>
                    <li><a href="/cgv" class="text-gray-400 hover:text-white transition-colors duration-300">CGV</a></li>
                </ul>
            </div>
        </div>
        
        <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {{ current_year }} {{ site_name }}. Tous droits réservés.</p>
            <p class="mt-2 text-sm">Site créé avec KLM Pegasus</p>
        </div>
    </div>
</footer>'''
        }
        
    async def initialize(self):
        """Initialise le service de construction de sites"""
        try:
            # Création des dossiers nécessaires
            os.makedirs(self.templates_path, exist_ok=True)
            os.makedirs(self.output_path, exist_ok=True)
            
            # Création des templates de base
            await self._create_base_templates()
            
            # Initialisation de Jinja2
            self.jinja_env = Environment(
                loader=FileSystemLoader(self.templates_path),
                autoescape=True
            )
            
            logger.info("Service de construction de sites initialisé avec succès")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation du site builder: {e}")
            raise

    async def build_site(
        self,
        structure: SiteStructure,
        branding: BrandingData,
        assets: List[AssetData]
    ) -> Dict[str, Any]:
        """
        Construit un site complet à partir de la structure et du branding
        """
        try:
            logger.info(f"Construction du site: {structure.site_id}")
            
            # Mise à jour du statut
            await self._update_site_status(structure.site_id, "building", 10, "Préparation de la construction")
            
            # Préparation des données pour les templates
            template_data = await self._prepare_template_data(structure, branding, assets)
            
            # Mise à jour du statut
            await self._update_site_status(structure.site_id, "building", 30, "Génération des pages")
            
            # Génération des pages HTML
            site_files = await self._generate_pages(structure, template_data)
            
            # Mise à jour du statut
            await self._update_site_status(structure.site_id, "building", 60, "Génération des assets")
            
            # Génération des fichiers CSS et JS personnalisés
            css_content = await self._generate_custom_css(branding)
            js_content = await self._generate_custom_js(structure)
            
            site_files['assets/custom.css'] = css_content
            site_files['assets/custom.js'] = js_content
            
            # Mise à jour du statut
            await self._update_site_status(structure.site_id, "building", 80, "Sauvegarde des fichiers")
            
            # Sauvegarde des fichiers
            site_path = await self._save_site_files(structure.site_id, site_files)
            
            # Génération de l'URL de prévisualisation
            preview_url = f"https://preview.klmpegasus.com/{structure.site_id}"
            
            # Mise à jour du statut final
            await self._update_site_status(structure.site_id, "completed", 100, "Site construit avec succès")
            
            site_data = {
                "site_id": structure.site_id,
                "preview_url": preview_url,
                "site_path": site_path,
                "files": list(site_files.keys()),
                "branding": branding,
                "structure": structure,
                "assets": assets,
                "created_at": datetime.now().isoformat()
            }
            
            logger.info(f"Site construit avec succès: {structure.site_id}")
            return site_data
            
        except Exception as e:
            logger.error(f"Erreur lors de la construction du site: {e}")
            await self._update_site_status(structure.site_id, "error", 0, f"Erreur: {str(e)}")
            raise

    async def get_site_status(self, site_id: str) -> SiteStatus:
        """Récupère le statut de construction d'un site"""
        try:
            if site_id in self.site_statuses:
                status_data = self.site_statuses[site_id]
                return SiteStatus(**status_data)
            else:
                return SiteStatus(
                    site_id=site_id,
                    status="not_found",
                    progress_percentage=0,
                    current_step="Site non trouvé",
                    last_updated=datetime.now()
                )
                
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du statut: {e}")
            raise

    async def save_site_to_database(self, site_data: Dict[str, Any], user_id: str):
        """Sauvegarde les données du site en base de données"""
        try:
            # Dans une implémentation complète, ceci sauvegarderait en base de données
            # Pour l'instant, sauvegarde en fichier JSON
            
            db_data = {
                "user_id": user_id,
                "site_data": site_data,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            db_file = f"{self.output_path}/{site_data['site_id']}/site_data.json"
            async with aiofiles.open(db_file, 'w') as f:
                await f.write(json.dumps(db_data, indent=2))
            
            logger.info(f"Données du site sauvegardées: {site_data['site_id']}")
            
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde en base: {e}")
            raise

    async def deploy_site(self, site_data: Dict[str, Any]):
        """Déploie le site sur CDN"""
        try:
            logger.info(f"Déploiement du site: {site_data['site_id']}")
            
            # Dans une implémentation complète, ceci déploierait sur un CDN
            # Pour l'instant, simulation du déploiement
            
            await asyncio.sleep(2)  # Simulation du temps de déploiement
            
            # Mise à jour du statut
            await self._update_site_status(
                site_data['site_id'], 
                "deployed", 
                100, 
                "Site déployé avec succès"
            )
            
            logger.info(f"Site déployé avec succès: {site_data['site_id']}")
            
        except Exception as e:
            logger.error(f"Erreur lors du déploiement: {e}")
            raise

    async def _create_base_templates(self):
        """Crée les templates de base"""
        try:
            # Création du dossier components
            components_path = os.path.join(self.templates_path, 'components')
            os.makedirs(components_path, exist_ok=True)
            
            # Sauvegarde des templates
            for template_name, content in self.base_templates.items():
                if template_name in ['header', 'footer']:
                    file_path = os.path.join(components_path, f"{template_name}.html")
                else:
                    file_path = os.path.join(self.templates_path, f"{template_name}.html")
                
                async with aiofiles.open(file_path, 'w') as f:
                    await f.write(content)
            
        except Exception as e:
            logger.error(f"Erreur lors de la création des templates: {e}")
            raise

    async def _prepare_template_data(
        self,
        structure: SiteStructure,
        branding: BrandingData,
        assets: List[AssetData]
    ) -> Dict[str, Any]:
        """Prépare les données pour les templates"""
        try:
            # Création d'un dictionnaire d'assets par type
            assets_by_type = {}
            for asset in assets:
                if asset.asset_type not in assets_by_type:
                    assets_by_type[asset.asset_type] = []
                assets_by_type[asset.asset_type].append(asset)
            
            # Données de base
            template_data = {
                # Informations du site
                "site_id": structure.site_id,
                "site_name": "Mon Entreprise",  # À extraire de la structure
                "site_description": "Description de mon entreprise",
                
                # Branding
                "primary_color": branding.color_scheme.primary,
                "secondary_color": branding.color_scheme.secondary,
                "accent_color": branding.color_scheme.accent,
                "background_color": branding.color_scheme.background,
                "text_color": branding.color_scheme.text,
                "heading_font": branding.typography.heading_font,
                "body_font": branding.typography.body_font,
                "brand_values": branding.brand_values,
                "tagline": branding.tagline,
                
                # Assets
                "logo_url": assets_by_type.get('logo', [{}])[0].url if assets_by_type.get('logo') else "/assets/logo.png",
                "favicon_url": "/assets/favicon.ico",
                "hero_image": assets_by_type.get('hero', [{}])[0].url if assets_by_type.get('hero') else "/assets/hero.jpg",
                
                # Navigation
                "navigation": [
                    {"label": "Accueil", "url": "#home"},
                    {"label": "Produits", "url": "#products"},
                    {"label": "À propos", "url": "#about"},
                    {"label": "Contact", "url": "#contact"}
                ],
                
                # Contenu par défaut
                "hero_title": "Bienvenue chez Mon Entreprise",
                "hero_subtitle": "Découvrez nos produits et services exceptionnels",
                "hero_image_alt": "Image hero",
                "cta_primary": "Découvrir",
                "cta_secondary": "En savoir plus",
                
                # Features
                "features_title": "Nos Avantages",
                "features_subtitle": "Pourquoi nous choisir",
                "features": [
                    {
                        "title": "Qualité Premium",
                        "description": "Des produits de la plus haute qualité",
                        "icon": assets_by_type.get('icon', [{}])[0].url if assets_by_type.get('icon') else "/assets/icon1.png"
                    },
                    {
                        "title": "Livraison Rapide",
                        "description": "Livraison en 24-48h partout en France",
                        "icon": assets_by_type.get('icon', [{}])[1].url if len(assets_by_type.get('icon', [])) > 1 else "/assets/icon2.png"
                    },
                    {
                        "title": "Support Client",
                        "description": "Une équipe dédiée à votre service",
                        "icon": assets_by_type.get('icon', [{}])[2].url if len(assets_by_type.get('icon', [])) > 2 else "/assets/icon3.png"
                    }
                ],
                
                # Products
                "products_title": "Nos Produits",
                "products_subtitle": "Découvrez notre sélection",
                "products": [
                    {
                        "name": "Produit 1",
                        "description": "Description du produit 1",
                        "price": "29,99 €",
                        "image": assets_by_type.get('product', [{}])[0].url if assets_by_type.get('product') else "/assets/product1.jpg"
                    },
                    {
                        "name": "Produit 2",
                        "description": "Description du produit 2",
                        "price": "39,99 €",
                        "image": assets_by_type.get('product', [{}])[1].url if len(assets_by_type.get('product', [])) > 1 else "/assets/product2.jpg"
                    },
                    {
                        "name": "Produit 3",
                        "description": "Description du produit 3",
                        "price": "49,99 €",
                        "image": assets_by_type.get('product', [{}])[2].url if len(assets_by_type.get('product', [])) > 2 else "/assets/product3.jpg"
                    }
                ],
                
                # About
                "about_title": "À Propos de Nous",
                "about_description": "Notre histoire et nos valeurs",
                "about_image": "/assets/about.jpg",
                
                # Contact
                "contact_title": "Contactez-Nous",
                "contact_subtitle": "Nous sommes là pour vous aider",
                "contact_email": "contact@monentreprise.com",
                "contact_phone": "+33 1 23 45 67 89",
                "contact_address": "123 Rue de la Paix, 75001 Paris",
                
                # Meta
                "current_year": datetime.now().year,
                "page_title": "Accueil",
                "page_description": "Bienvenue sur notre site",
                "page_keywords": "entreprise, produits, services"
            }
            
            return template_data
            
        except Exception as e:
            logger.error(f"Erreur lors de la préparation des données: {e}")
            raise

    async def _generate_pages(
        self,
        structure: SiteStructure,
        template_data: Dict[str, Any]
    ) -> Dict[str, str]:
        """Génère les pages HTML"""
        try:
            site_files = {}
            
            # Génération de la page d'accueil
            home_template = self.jinja_env.get_template('home.html')
            home_html = home_template.render(**template_data)
            site_files['index.html'] = home_html
            
            # Génération des pages additionnelles
            for page in structure.pages:
                if page.page_type != 'home':
                    # Pour l'instant, utilisation du template home pour toutes les pages
                    # Dans une implémentation complète, chaque type de page aurait son template
                    page_template_data = {**template_data}
                    page_template_data.update({
                        "page_title": page.page_name,
                        "page_description": page.meta_data.get('description', ''),
                        "page_keywords": ', '.join(page.meta_data.get('keywords', []))
                    })
                    
                    page_html = home_template.render(**page_template_data)
                    site_files[f"{page.page_id}.html"] = page_html
            
            return site_files
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération des pages: {e}")
            raise

    async def _generate_custom_css(self, branding: BrandingData) -> str:
        """Génère le CSS personnalisé"""
        try:
            css_content = f"""
/* CSS personnalisé généré automatiquement */
:root {{
    --primary-color: {branding.color_scheme.primary};
    --secondary-color: {branding.color_scheme.secondary};
    --accent-color: {branding.color_scheme.accent};
    --background-color: {branding.color_scheme.background};
    --text-color: {branding.color_scheme.text};
}}

/* Animations */
@keyframes fadeIn {{
    from {{ opacity: 0; transform: translateY(20px); }}
    to {{ opacity: 1; transform: translateY(0); }}
}}

.animate-fade-in {{
    animation: fadeIn 0.6s ease-out forwards;
}}

/* Styles personnalisés */
.gradient-bg {{
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
}}

.text-primary {{ color: var(--primary-color); }}
.bg-primary {{ background-color: var(--primary-color); }}
.border-primary {{ border-color: var(--primary-color); }}

/* Responsive */
@media (max-width: 768px) {{
    .hero-section h1 {{
        font-size: 2.5rem;
    }}
    
    .section-padding {{
        padding: 40px 0;
    }}
}}
"""
            return css_content
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du CSS: {e}")
            return ""

    async def _generate_custom_js(self, structure: SiteStructure) -> str:
        """Génère le JavaScript personnalisé"""
        try:
            js_content = """
// JavaScript personnalisé généré automatiquement

// Gestion du menu mobile
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Smooth scrolling
document.addEventListener('DOMContentLoaded', function() {
    // Liens d'ancrage
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Animation au scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);
    
    // Observer tous les éléments avec la classe animate-on-scroll
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
    
    // Gestion des formulaires
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Traitement du formulaire
            console.log('Formulaire soumis');
        });
    });
});

// Utilitaires
function showNotification(message, type = 'info') {
    // Affichage de notifications
    console.log(`${type.toUpperCase()}: ${message}`);
}
"""
            return js_content
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du JS: {e}")
            return ""

    async def _save_site_files(
        self,
        site_id: str,
        site_files: Dict[str, str]
    ) -> str:
        """Sauvegarde les fichiers du site"""
        try:
            site_path = os.path.join(self.output_path, site_id)
            os.makedirs(site_path, exist_ok=True)
            
            # Création du dossier assets
            assets_path = os.path.join(site_path, 'assets')
            os.makedirs(assets_path, exist_ok=True)
            
            # Sauvegarde de chaque fichier
            for file_path, content in site_files.items():
                full_path = os.path.join(site_path, file_path)
                
                # Création des dossiers parents si nécessaire
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                
                async with aiofiles.open(full_path, 'w', encoding='utf-8') as f:
                    await f.write(content)
            
            logger.info(f"Fichiers sauvegardés dans: {site_path}")
            return site_path
            
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde des fichiers: {e}")
            raise

    async def _update_site_status(
        self,
        site_id: str,
        status: str,
        progress: float,
        current_step: str,
        error_message: Optional[str] = None
    ):
        """Met à jour le statut de construction d'un site"""
        try:
            self.site_statuses[site_id] = {
                "site_id": site_id,
                "status": status,
                "progress_percentage": progress,
                "current_step": current_step,
                "error_message": error_message,
                "last_updated": datetime.now()
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour du statut: {e}")

