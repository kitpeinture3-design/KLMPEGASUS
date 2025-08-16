import openai
import json
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import os
from models.schemas import (
    SiteGenerationRequest, 
    BrandingData, 
    SiteStructure, 
    PageStructure,
    ContentOptimization,
    AIInsight
)

logger = logging.getLogger(__name__)

class AIGenerator:
    """Service de génération de contenu et de structure de site par IA"""
    
    def __init__(self):
        self.client = None
        self.model = "gpt-4"
        self.max_tokens = 4000
        self.temperature = 0.7
        
    async def initialize(self):
        """Initialise le client OpenAI"""
        try:
            # Le client OpenAI est déjà configuré via les variables d'environnement
            self.client = openai.OpenAI()
            logger.info("Client OpenAI initialisé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation d'OpenAI: {e}")
            raise

    async def generate_site_structure(
        self, 
        business_info: SiteGenerationRequest, 
        branding: BrandingData
    ) -> SiteStructure:
        """
        Génère la structure complète d'un site e-commerce
        """
        try:
            logger.info(f"Génération de la structure pour: {business_info.business_name}")
            
            # Prompt pour la génération de structure
            prompt = self._create_structure_prompt(business_info, branding)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en création de sites e-commerce. Tu génères des structures de site optimisées pour la conversion et l'expérience utilisateur."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            # Parse la réponse JSON
            structure_data = json.loads(response.choices[0].message.content)
            
            # Convertit en objet SiteStructure
            site_structure = self._parse_site_structure(structure_data, business_info)
            
            logger.info(f"Structure générée avec {len(site_structure.pages)} pages")
            return site_structure
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de structure: {e}")
            raise

    async def generate_page_content(
        self, 
        page_type: str, 
        business_info: SiteGenerationRequest,
        branding: BrandingData,
        additional_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Génère le contenu détaillé pour une page spécifique
        """
        try:
            prompt = self._create_content_prompt(page_type, business_info, branding, additional_context)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un rédacteur expert en e-commerce. Tu crées du contenu engageant et optimisé pour la conversion."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            content_data = json.loads(response.choices[0].message.content)
            return content_data
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de contenu: {e}")
            raise

    async def optimize_content(
        self, 
        content: str, 
        optimization_type: str,
        target_keywords: List[str] = None
    ) -> ContentOptimization:
        """
        Optimise le contenu pour le SEO et la conversion
        """
        try:
            prompt = f"""
            Optimise le contenu suivant pour {optimization_type}:
            
            Contenu original:
            {content}
            
            Mots-clés cibles: {', '.join(target_keywords) if target_keywords else 'Aucun'}
            
            Fournis:
            1. Le contenu optimisé
            2. Liste des améliorations apportées
            3. Score SEO estimé (0-100)
            4. Score de lisibilité (0-100)
            
            Format JSON:
            {{
                "optimized_content": "...",
                "improvements": ["..."],
                "seo_score": 85,
                "readability_score": 90
            }}
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en optimisation de contenu SEO et conversion."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=0.3
            )
            
            optimization_data = json.loads(response.choices[0].message.content)
            
            return ContentOptimization(
                original_content=content,
                optimized_content=optimization_data["optimized_content"],
                improvements=optimization_data["improvements"],
                seo_score=optimization_data.get("seo_score"),
                readability_score=optimization_data.get("readability_score")
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de l'optimisation de contenu: {e}")
            raise

    async def generate_product_descriptions(
        self, 
        products: List[Dict], 
        brand_voice: str,
        target_audience: str
    ) -> List[Dict]:
        """
        Génère des descriptions de produits optimisées
        """
        try:
            enhanced_products = []
            
            for product in products:
                prompt = f"""
                Génère une description de produit engageante pour:
                
                Nom du produit: {product.get('name', '')}
                Catégorie: {product.get('category', '')}
                Caractéristiques: {product.get('features', [])}
                Prix: {product.get('price', '')}
                
                Ton de marque: {brand_voice}
                Audience cible: {target_audience}
                
                Fournis:
                1. Titre accrocheur
                2. Description courte (50 mots)
                3. Description longue (150-200 mots)
                4. Points clés (3-5 bullet points)
                5. Mots-clés SEO
                
                Format JSON:
                {{
                    "title": "...",
                    "short_description": "...",
                    "long_description": "...",
                    "key_points": ["..."],
                    "seo_keywords": ["..."]
                }}
                """
                
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "Tu es un expert en rédaction de descriptions de produits e-commerce."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=1000,
                    temperature=0.7
                )
                
                description_data = json.loads(response.choices[0].message.content)
                
                enhanced_product = {
                    **product,
                    **description_data
                }
                enhanced_products.append(enhanced_product)
                
                # Pause pour éviter les limites de taux
                await asyncio.sleep(0.5)
            
            return enhanced_products
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de descriptions: {e}")
            raise

    async def generate_market_insights(
        self, 
        industry: str, 
        target_audience: str,
        competitor_data: Optional[List[Dict]] = None
    ) -> List[AIInsight]:
        """
        Génère des insights sur le marché et la concurrence
        """
        try:
            prompt = f"""
            Analyse le marché pour:
            Secteur: {industry}
            Audience cible: {target_audience}
            Données concurrents: {json.dumps(competitor_data) if competitor_data else 'Aucune'}
            
            Fournis des insights sur:
            1. Tendances du marché
            2. Opportunités identifiées
            3. Recommandations stratégiques
            4. Fonctionnalités recommandées
            5. Stratégie de prix
            
            Format JSON avec array d'insights:
            {{
                "insights": [
                    {{
                        "insight_type": "market_trend",
                        "title": "...",
                        "description": "...",
                        "confidence_score": 0.85,
                        "actionable_recommendations": ["..."]
                    }}
                ]
            }}
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un analyste de marché expert en e-commerce."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=0.6
            )
            
            insights_data = json.loads(response.choices[0].message.content)
            
            insights = []
            for insight_data in insights_data["insights"]:
                insight = AIInsight(**insight_data)
                insights.append(insight)
            
            return insights
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération d'insights: {e}")
            raise

    def _create_structure_prompt(
        self, 
        business_info: SiteGenerationRequest, 
        branding: BrandingData
    ) -> str:
        """Crée le prompt pour la génération de structure"""
        return f"""
        Génère la structure complète d'un site e-commerce pour:
        
        Entreprise: {business_info.business_name}
        Secteur: {business_info.industry}
        Description: {business_info.description}
        Audience cible: {business_info.target_audience}
        Fonctionnalités requises: {business_info.features_required}
        
        Branding:
        - Ton de marque: {branding.brand_voice}
        - Valeurs: {', '.join(branding.brand_values)}
        - Slogan: {branding.tagline}
        
        Génère une structure avec:
        1. Page d'accueil optimisée pour la conversion
        2. Pages produits/services
        3. Page à propos
        4. Page contact
        5. Pages légales nécessaires
        6. Navigation optimisée
        7. Intégrations e-commerce
        
        Format JSON:
        {{
            "site_id": "unique_id",
            "pages": [
                {{
                    "page_id": "home",
                    "page_name": "Accueil",
                    "page_type": "home",
                    "sections": [
                        {{
                            "section_type": "hero",
                            "content": {{...}},
                            "settings": {{...}}
                        }}
                    ],
                    "meta_data": {{
                        "title": "...",
                        "description": "...",
                        "keywords": ["..."]
                    }},
                    "seo_data": {{...}}
                }}
            ],
            "navigation": {{...}},
            "global_settings": {{...}},
            "integrations": ["stripe", "analytics", "seo"]
        }}
        """

    def _create_content_prompt(
        self, 
        page_type: str, 
        business_info: SiteGenerationRequest,
        branding: BrandingData,
        additional_context: Optional[Dict] = None
    ) -> str:
        """Crée le prompt pour la génération de contenu"""
        context = additional_context or {}
        
        return f"""
        Génère le contenu détaillé pour une page {page_type} de site e-commerce:
        
        Entreprise: {business_info.business_name}
        Secteur: {business_info.industry}
        Description: {business_info.description}
        Audience cible: {business_info.target_audience}
        
        Branding:
        - Ton: {branding.brand_voice}
        - Valeurs: {', '.join(branding.brand_values)}
        - Slogan: {branding.tagline}
        
        Contexte additionnel: {json.dumps(context)}
        
        Génère un contenu engageant, optimisé SEO et orienté conversion.
        Inclus des appels à l'action pertinents et du contenu persuasif.
        
        Format JSON avec sections détaillées.
        """

    def _parse_site_structure(
        self, 
        structure_data: Dict, 
        business_info: SiteGenerationRequest
    ) -> SiteStructure:
        """Parse les données de structure en objet SiteStructure"""
        try:
            pages = []
            for page_data in structure_data["pages"]:
                page = PageStructure(
                    page_id=page_data["page_id"],
                    page_name=page_data["page_name"],
                    page_type=page_data["page_type"],
                    sections=page_data["sections"],
                    meta_data=page_data["meta_data"],
                    seo_data=page_data["seo_data"]
                )
                pages.append(page)
            
            return SiteStructure(
                site_id=structure_data["site_id"],
                pages=pages,
                navigation=structure_data["navigation"],
                global_settings=structure_data["global_settings"],
                integrations=structure_data["integrations"]
            )
            
        except Exception as e:
            logger.error(f"Erreur lors du parsing de structure: {e}")
            raise

