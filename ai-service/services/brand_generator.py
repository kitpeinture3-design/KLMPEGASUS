import openai
import json
import asyncio
import logging
import random
from typing import Dict, List, Any, Optional
from datetime import datetime
import colorsys
from models.schemas import (
    BrandingData, 
    ColorScheme, 
    Typography,
    IndustryType,
    StylePreference
)

logger = logging.getLogger(__name__)

class BrandGenerator:
    """Service de génération de branding complet (logo, couleurs, typographie)"""
    
    def __init__(self):
        self.client = None
        self.model = "gpt-4"
        
        # Palettes de couleurs prédéfinies par industrie
        self.industry_color_palettes = {
            IndustryType.FASHION: [
                {"primary": "#000000", "secondary": "#FFFFFF", "accent": "#FF6B6B"},
                {"primary": "#2C3E50", "secondary": "#ECF0F1", "accent": "#E74C3C"},
                {"primary": "#8E44AD", "secondary": "#F8F9FA", "accent": "#F39C12"}
            ],
            IndustryType.ELECTRONICS: [
                {"primary": "#2980B9", "secondary": "#ECF0F1", "accent": "#3498DB"},
                {"primary": "#34495E", "secondary": "#BDC3C7", "accent": "#1ABC9C"},
                {"primary": "#27AE60", "secondary": "#FFFFFF", "accent": "#F1C40F"}
            ],
            IndustryType.HEALTH_BEAUTY: [
                {"primary": "#E91E63", "secondary": "#FCE4EC", "accent": "#FF9800"},
                {"primary": "#9C27B0", "secondary": "#F3E5F5", "accent": "#4CAF50"},
                {"primary": "#00BCD4", "secondary": "#E0F2F1", "accent": "#FF5722"}
            ],
            IndustryType.HOME_GARDEN: [
                {"primary": "#4CAF50", "secondary": "#E8F5E8", "accent": "#FF9800"},
                {"primary": "#795548", "secondary": "#EFEBE9", "accent": "#8BC34A"},
                {"primary": "#607D8B", "secondary": "#ECEFF1", "accent": "#FFC107"}
            ],
            IndustryType.SPORTS_FITNESS: [
                {"primary": "#FF5722", "secondary": "#FFF3E0", "accent": "#4CAF50"},
                {"primary": "#2196F3", "secondary": "#E3F2FD", "accent": "#FF9800"},
                {"primary": "#9C27B0", "secondary": "#F3E5F5", "accent": "#CDDC39"}
            ]
        }
        
        # Polices par style
        self.font_combinations = {
            StylePreference.MODERN: {
                "heading": "Inter",
                "body": "Inter",
                "sizes": {"h1": "3rem", "h2": "2.5rem", "h3": "2rem", "body": "1rem"}
            },
            StylePreference.CLASSIC: {
                "heading": "Playfair Display",
                "body": "Source Sans Pro",
                "sizes": {"h1": "3.5rem", "h2": "2.75rem", "h3": "2.25rem", "body": "1.1rem"}
            },
            StylePreference.MINIMALIST: {
                "heading": "Poppins",
                "body": "Poppins",
                "sizes": {"h1": "2.5rem", "h2": "2rem", "h3": "1.75rem", "body": "1rem"}
            },
            StylePreference.BOLD: {
                "heading": "Montserrat",
                "body": "Open Sans",
                "sizes": {"h1": "4rem", "h2": "3rem", "h3": "2.5rem", "body": "1.1rem"}
            },
            StylePreference.ELEGANT: {
                "heading": "Cormorant Garamond",
                "body": "Lato",
                "sizes": {"h1": "3.5rem", "h2": "2.75rem", "h3": "2.25rem", "body": "1.1rem"}
            }
        }
        
    async def initialize(self):
        """Initialise le service de génération de branding"""
        try:
            self.client = openai.OpenAI()
            logger.info("Service de branding initialisé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation du branding: {e}")
            raise

    async def generate_branding(
        self,
        business_name: str,
        industry: IndustryType,
        description: str,
        target_audience: str,
        style_preferences: Optional[List[StylePreference]] = None,
        color_preferences: Optional[List[str]] = None
    ) -> BrandingData:
        """
        Génère un branding complet pour une entreprise
        """
        try:
            logger.info(f"Génération de branding pour: {business_name}")
            
            # Génération de la stratégie de marque
            brand_strategy = await self._generate_brand_strategy(
                business_name, industry, description, target_audience
            )
            
            # Génération de la palette de couleurs
            color_scheme = await self._generate_color_scheme(
                industry, style_preferences, color_preferences, brand_strategy
            )
            
            # Génération de la typographie
            typography = await self._generate_typography(
                style_preferences, brand_strategy
            )
            
            # Génération du logo (URL placeholder pour l'instant)
            logo_url = await self._generate_logo_placeholder(business_name, color_scheme)
            
            branding_data = BrandingData(
                logo_url=logo_url,
                color_scheme=color_scheme,
                typography=typography,
                brand_voice=brand_strategy["brand_voice"],
                brand_values=brand_strategy["brand_values"],
                tagline=brand_strategy["tagline"]
            )
            
            logger.info(f"Branding généré avec succès pour {business_name}")
            return branding_data
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de branding: {e}")
            raise

    async def generate_complete_branding(
        self,
        business_name: str,
        industry: IndustryType,
        style_preferences: Optional[List[StylePreference]] = None,
        color_preferences: Optional[List[str]] = None
    ) -> BrandingData:
        """
        Génère un branding complet avec analyse approfondie
        """
        try:
            # Analyse de l'industrie et génération de recommandations
            industry_analysis = await self._analyze_industry(industry)
            
            # Génération de la stratégie de marque basée sur l'analyse
            brand_strategy = await self._generate_advanced_brand_strategy(
                business_name, industry, industry_analysis
            )
            
            # Génération des éléments visuels
            color_scheme = await self._generate_advanced_color_scheme(
                industry, style_preferences, color_preferences, brand_strategy
            )
            
            typography = await self._generate_advanced_typography(
                style_preferences, brand_strategy, industry
            )
            
            logo_url = await self._generate_logo_placeholder(business_name, color_scheme)
            
            return BrandingData(
                logo_url=logo_url,
                color_scheme=color_scheme,
                typography=typography,
                brand_voice=brand_strategy["brand_voice"],
                brand_values=brand_strategy["brand_values"],
                tagline=brand_strategy["tagline"]
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de branding avancé: {e}")
            raise

    async def _generate_brand_strategy(
        self,
        business_name: str,
        industry: IndustryType,
        description: str,
        target_audience: str
    ) -> Dict[str, Any]:
        """Génère la stratégie de marque via IA"""
        try:
            prompt = f"""
            Crée une stratégie de marque complète pour:
            
            Nom de l'entreprise: {business_name}
            Secteur: {industry.value}
            Description: {description}
            Audience cible: {target_audience}
            
            Génère:
            1. Ton de marque (personnalité de la marque)
            2. 5 valeurs fondamentales de la marque
            3. Un slogan accrocheur et mémorable
            4. Positionnement sur le marché
            5. Promesse de marque
            
            Format JSON:
            {{
                "brand_voice": "description du ton (ex: moderne et accessible)",
                "brand_values": ["valeur1", "valeur2", "valeur3", "valeur4", "valeur5"],
                "tagline": "slogan accrocheur",
                "positioning": "positionnement sur le marché",
                "brand_promise": "promesse de marque"
            }}
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en stratégie de marque et branding. Tu crées des identités de marque fortes et cohérentes."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1500,
                temperature=0.7
            )
            
            strategy_data = json.loads(response.choices[0].message.content)
            return strategy_data
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de stratégie: {e}")
            raise

    async def _generate_color_scheme(
        self,
        industry: IndustryType,
        style_preferences: Optional[List[StylePreference]],
        color_preferences: Optional[List[str]],
        brand_strategy: Dict[str, Any]
    ) -> ColorScheme:
        """Génère une palette de couleurs adaptée"""
        try:
            # Sélection d'une palette de base selon l'industrie
            base_palettes = self.industry_color_palettes.get(
                industry, 
                self.industry_color_palettes[IndustryType.OTHER]
            )
            
            if not base_palettes:
                base_palettes = [
                    {"primary": "#2563EB", "secondary": "#F8FAFC", "accent": "#10B981"}
                ]
            
            # Sélection intelligente basée sur les préférences
            selected_palette = self._select_best_palette(
                base_palettes, style_preferences, color_preferences
            )
            
            # Génération des couleurs complémentaires
            background_color = "#FFFFFF"
            text_color = "#1F2937"
            
            # Ajustement selon le style
            if style_preferences and StylePreference.MINIMALIST in style_preferences:
                background_color = "#FAFAFA"
                text_color = "#374151"
            elif style_preferences and StylePreference.BOLD in style_preferences:
                text_color = "#111827"
            
            return ColorScheme(
                primary=selected_palette["primary"],
                secondary=selected_palette["secondary"],
                accent=selected_palette["accent"],
                background=background_color,
                text=text_color
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de couleurs: {e}")
            raise

    async def _generate_typography(
        self,
        style_preferences: Optional[List[StylePreference]],
        brand_strategy: Dict[str, Any]
    ) -> Typography:
        """Génère la typographie adaptée au style"""
        try:
            # Sélection du style principal
            primary_style = StylePreference.MODERN
            if style_preferences:
                primary_style = style_preferences[0]
            
            # Récupération de la combinaison de polices
            font_combo = self.font_combinations.get(
                primary_style,
                self.font_combinations[StylePreference.MODERN]
            )
            
            return Typography(
                heading_font=font_combo["heading"],
                body_font=font_combo["body"],
                font_sizes=font_combo["sizes"]
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de typographie: {e}")
            raise

    async def _generate_logo_placeholder(
        self,
        business_name: str,
        color_scheme: ColorScheme
    ) -> str:
        """Génère un placeholder pour le logo"""
        # Pour l'instant, retourne un placeholder
        # Dans une implémentation complète, ceci appellerait un service de génération d'images
        return f"https://via.placeholder.com/200x80/{color_scheme.primary.replace('#', '')}/{color_scheme.text.replace('#', '')}?text={business_name.replace(' ', '+')}"

    async def _analyze_industry(self, industry: IndustryType) -> Dict[str, Any]:
        """Analyse les tendances et caractéristiques de l'industrie"""
        try:
            prompt = f"""
            Analyse le secteur {industry.value} pour le e-commerce:
            
            Fournis:
            1. Tendances actuelles du marché
            2. Couleurs populaires dans ce secteur
            3. Styles de design préférés
            4. Attentes des consommateurs
            5. Éléments de différenciation importants
            
            Format JSON:
            {{
                "market_trends": ["tendance1", "tendance2"],
                "popular_colors": ["#couleur1", "#couleur2"],
                "design_styles": ["style1", "style2"],
                "consumer_expectations": ["attente1", "attente2"],
                "differentiation_factors": ["facteur1", "facteur2"]
            }}
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un analyste de marché expert en e-commerce et design."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.6
            )
            
            analysis_data = json.loads(response.choices[0].message.content)
            return analysis_data
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse d'industrie: {e}")
            return {}

    async def _generate_advanced_brand_strategy(
        self,
        business_name: str,
        industry: IndustryType,
        industry_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Génère une stratégie de marque avancée basée sur l'analyse"""
        try:
            prompt = f"""
            Crée une stratégie de marque avancée pour {business_name} dans le secteur {industry.value}:
            
            Analyse du marché:
            {json.dumps(industry_analysis, indent=2)}
            
            Génère une stratégie qui:
            1. Se différencie de la concurrence
            2. Répond aux attentes des consommateurs
            3. Capitalise sur les tendances du marché
            4. Crée une connexion émotionnelle
            
            Format JSON:
            {{
                "brand_voice": "ton de marque unique",
                "brand_values": ["valeur1", "valeur2", "valeur3", "valeur4", "valeur5"],
                "tagline": "slogan différenciant",
                "positioning": "positionnement unique",
                "brand_promise": "promesse de valeur",
                "emotional_connection": "connexion émotionnelle",
                "differentiation_strategy": "stratégie de différenciation"
            }}
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un stratège de marque expert qui crée des identités uniques et mémorables."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1500,
                temperature=0.7
            )
            
            strategy_data = json.loads(response.choices[0].message.content)
            return strategy_data
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de stratégie avancée: {e}")
            raise

    async def _generate_advanced_color_scheme(
        self,
        industry: IndustryType,
        style_preferences: Optional[List[StylePreference]],
        color_preferences: Optional[List[str]],
        brand_strategy: Dict[str, Any]
    ) -> ColorScheme:
        """Génère une palette de couleurs avancée via IA"""
        try:
            prompt = f"""
            Crée une palette de couleurs unique pour:
            
            Secteur: {industry.value}
            Style préféré: {style_preferences[0].value if style_preferences else 'moderne'}
            Couleurs préférées: {color_preferences if color_preferences else 'aucune préférence'}
            Ton de marque: {brand_strategy.get('brand_voice', '')}
            Positionnement: {brand_strategy.get('positioning', '')}
            
            Génère une palette harmonieuse et professionnelle avec:
            1. Couleur principale (primary) - couleur de marque forte
            2. Couleur secondaire (secondary) - couleur de support
            3. Couleur d'accent (accent) - pour les CTA et highlights
            4. Couleur de fond (background)
            5. Couleur de texte (text)
            
            Format JSON:
            {{
                "primary": "#hexcode",
                "secondary": "#hexcode",
                "accent": "#hexcode",
                "background": "#hexcode",
                "text": "#hexcode",
                "rationale": "explication des choix de couleurs"
            }}
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en théorie des couleurs et design de marque."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=800,
                temperature=0.6
            )
            
            color_data = json.loads(response.choices[0].message.content)
            
            return ColorScheme(
                primary=color_data["primary"],
                secondary=color_data["secondary"],
                accent=color_data["accent"],
                background=color_data["background"],
                text=color_data["text"]
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de couleurs avancée: {e}")
            # Fallback vers la méthode simple
            return await self._generate_color_scheme(
                industry, style_preferences, color_preferences, brand_strategy
            )

    async def _generate_advanced_typography(
        self,
        style_preferences: Optional[List[StylePreference]],
        brand_strategy: Dict[str, Any],
        industry: IndustryType
    ) -> Typography:
        """Génère une typographie avancée adaptée à la marque"""
        try:
            prompt = f"""
            Recommande une combinaison de polices pour:
            
            Style préféré: {style_preferences[0].value if style_preferences else 'moderne'}
            Ton de marque: {brand_strategy.get('brand_voice', '')}
            Secteur: {industry.value}
            Positionnement: {brand_strategy.get('positioning', '')}
            
            Recommande:
            1. Police pour les titres (heading_font)
            2. Police pour le corps de texte (body_font)
            3. Tailles de police optimales
            
            Utilise des polices Google Fonts populaires et accessibles.
            
            Format JSON:
            {{
                "heading_font": "nom de la police",
                "body_font": "nom de la police",
                "font_sizes": {{
                    "h1": "taille",
                    "h2": "taille",
                    "h3": "taille",
                    "body": "taille"
                }},
                "rationale": "explication des choix typographiques"
            }}
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en typographie et design web."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=600,
                temperature=0.5
            )
            
            typo_data = json.loads(response.choices[0].message.content)
            
            return Typography(
                heading_font=typo_data["heading_font"],
                body_font=typo_data["body_font"],
                font_sizes=typo_data["font_sizes"]
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de typographie avancée: {e}")
            # Fallback vers la méthode simple
            return await self._generate_typography(style_preferences, brand_strategy)

    def _select_best_palette(
        self,
        palettes: List[Dict],
        style_preferences: Optional[List[StylePreference]],
        color_preferences: Optional[List[str]]
    ) -> Dict[str, str]:
        """Sélectionne la meilleure palette selon les préférences"""
        if not palettes:
            return {"primary": "#2563EB", "secondary": "#F8FAFC", "accent": "#10B981"}
        
        # Si des couleurs spécifiques sont préférées, essayer de les intégrer
        if color_preferences:
            for palette in palettes:
                for color_pref in color_preferences:
                    if any(color_pref.lower() in color.lower() for color in palette.values()):
                        return palette
        
        # Sélection basée sur le style
        if style_preferences:
            style = style_preferences[0]
            if style == StylePreference.MINIMALIST:
                # Préférer les palettes avec des couleurs neutres
                for palette in palettes:
                    if "#FFFFFF" in palette.values() or "#F8F9FA" in palette.values():
                        return palette
            elif style == StylePreference.BOLD:
                # Préférer les palettes avec des couleurs vives
                return palettes[0]  # Généralement la première est la plus audacieuse
        
        # Sélection aléatoire par défaut
        return random.choice(palettes)

