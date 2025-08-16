import asyncio
import aiohttp
import logging
from typing import Dict, List, Any, Optional
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin, urlparse
from datetime import datetime
import openai
from models.schemas import CompetitorAnalysis, MarketInsights

logger = logging.getLogger(__name__)

class ContentScraper:
    """Service de scraping et d'analyse de contenu web"""
    
    def __init__(self):
        self.client = openai.OpenAI()
        self.session = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
    async def initialize(self):
        """Initialise le service de scraping"""
        try:
            self.session = aiohttp.ClientSession(
                headers=self.headers,
                timeout=aiohttp.ClientTimeout(total=30)
            )
            logger.info("Service de scraping initialisé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation du scraper: {e}")
            raise

    async def analyze_website(
        self, 
        url: str, 
        analysis_type: str = "complete"
    ) -> Dict[str, Any]:
        """
        Analyse complète d'un site web concurrent
        """
        try:
            logger.info(f"Analyse du site: {url}")
            
            # Scraping du contenu
            page_content = await self._scrape_page(url)
            
            if not page_content:
                raise Exception(f"Impossible de scraper le site: {url}")
            
            # Extraction des données structurées
            structured_data = await self._extract_structured_data(page_content, url)
            
            # Analyse du contenu via IA
            ai_analysis = await self._analyze_content_with_ai(structured_data, url)
            
            # Analyse des éléments de design
            design_analysis = await self._analyze_design_elements(page_content)
            
            # Analyse SEO
            seo_analysis = await self._analyze_seo_elements(page_content, url)
            
            # Compilation des résultats
            complete_analysis = {
                "url": url,
                "scraped_at": datetime.now().isoformat(),
                "structured_data": structured_data,
                "ai_analysis": ai_analysis,
                "design_analysis": design_analysis,
                "seo_analysis": seo_analysis,
                "insights": await self._generate_insights(ai_analysis, design_analysis, seo_analysis),
                "recommendations": await self._generate_recommendations(ai_analysis, design_analysis)
            }
            
            return complete_analysis
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse du site {url}: {e}")
            raise

    async def analyze_competitor_landscape(
        self, 
        competitor_urls: List[str],
        industry: str
    ) -> MarketInsights:
        """
        Analyse le paysage concurrentiel d'une industrie
        """
        try:
            logger.info(f"Analyse de {len(competitor_urls)} concurrents dans {industry}")
            
            competitor_analyses = []
            
            # Analyse de chaque concurrent
            for url in competitor_urls:
                try:
                    analysis = await self.analyze_website(url, "competitor")
                    competitor_analysis = await self._create_competitor_analysis(analysis)
                    competitor_analyses.append(competitor_analysis)
                    
                    # Pause pour éviter la surcharge
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    logger.warning(f"Erreur lors de l'analyse de {url}: {e}")
                    continue
            
            # Génération des insights de marché
            market_insights = await self._generate_market_insights(
                competitor_analyses, industry
            )
            
            return market_insights
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse concurrentielle: {e}")
            raise

    async def extract_product_data(self, url: str) -> List[Dict[str, Any]]:
        """
        Extrait les données de produits d'un site e-commerce
        """
        try:
            logger.info(f"Extraction de produits depuis: {url}")
            
            page_content = await self._scrape_page(url)
            
            if not page_content:
                return []
            
            # Détection automatique de la structure des produits
            products = await self._detect_and_extract_products(page_content, url)
            
            # Enrichissement des données produits via IA
            enriched_products = await self._enrich_product_data(products)
            
            return enriched_products
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction de produits: {e}")
            return []

    async def _scrape_page(self, url: str) -> Optional[str]:
        """Scrape le contenu d'une page web"""
        try:
            if not self.session:
                await self.initialize()
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    content = await response.text()
                    return content
                else:
                    logger.warning(f"Statut HTTP {response.status} pour {url}")
                    return None
                    
        except Exception as e:
            logger.error(f"Erreur lors du scraping de {url}: {e}")
            return None

    async def _extract_structured_data(
        self, 
        html_content: str, 
        url: str
    ) -> Dict[str, Any]:
        """Extrait les données structurées d'une page"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Extraction des métadonnées
            title = soup.find('title')
            title_text = title.get_text().strip() if title else ""
            
            description = soup.find('meta', attrs={'name': 'description'})
            description_text = description.get('content', '') if description else ""
            
            # Extraction des headings
            headings = {
                'h1': [h.get_text().strip() for h in soup.find_all('h1')],
                'h2': [h.get_text().strip() for h in soup.find_all('h2')],
                'h3': [h.get_text().strip() for h in soup.find_all('h3')]
            }
            
            # Extraction du contenu textuel principal
            main_content = self._extract_main_content(soup)
            
            # Extraction des liens
            links = [
                {
                    'text': link.get_text().strip(),
                    'href': urljoin(url, link.get('href', ''))
                }
                for link in soup.find_all('a', href=True)
                if link.get_text().strip()
            ]
            
            # Extraction des images
            images = [
                {
                    'src': urljoin(url, img.get('src', '')),
                    'alt': img.get('alt', ''),
                    'title': img.get('title', '')
                }
                for img in soup.find_all('img', src=True)
            ]
            
            # Extraction des données JSON-LD
            json_ld_data = self._extract_json_ld(soup)
            
            return {
                "title": title_text,
                "description": description_text,
                "headings": headings,
                "main_content": main_content,
                "links": links[:50],  # Limiter pour éviter la surcharge
                "images": images[:20],
                "json_ld": json_ld_data,
                "word_count": len(main_content.split()) if main_content else 0
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction de données structurées: {e}")
            return {}

    async def _analyze_content_with_ai(
        self, 
        structured_data: Dict[str, Any], 
        url: str
    ) -> Dict[str, Any]:
        """Analyse le contenu avec l'IA"""
        try:
            prompt = f"""
            Analyse le contenu suivant d'un site web e-commerce:
            
            URL: {url}
            Titre: {structured_data.get('title', '')}
            Description: {structured_data.get('description', '')}
            Titres principaux: {structured_data.get('headings', {}).get('h1', [])}
            Contenu principal: {structured_data.get('main_content', '')[:2000]}...
            
            Fournis une analyse détaillée incluant:
            1. Type d'entreprise et secteur d'activité
            2. Proposition de valeur principale
            3. Audience cible identifiée
            4. Ton et style de communication
            5. Points forts du contenu
            6. Points d'amélioration
            7. Stratégie de contenu apparente
            8. Mots-clés principaux identifiés
            
            Format JSON:
            {{
                "business_type": "...",
                "industry": "...",
                "value_proposition": "...",
                "target_audience": "...",
                "communication_tone": "...",
                "content_strengths": ["..."],
                "improvement_areas": ["..."],
                "content_strategy": "...",
                "main_keywords": ["..."],
                "competitive_advantages": ["..."]
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en analyse de contenu web et stratégie marketing."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=2000,
                temperature=0.3
            )
            
            analysis_data = json.loads(response.choices[0].message.content)
            return analysis_data
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse IA: {e}")
            return {}

    async def _analyze_design_elements(self, html_content: str) -> Dict[str, Any]:
        """Analyse les éléments de design d'une page"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Extraction des couleurs CSS
            colors = self._extract_colors(soup)
            
            # Analyse de la structure de layout
            layout_structure = self._analyze_layout_structure(soup)
            
            # Extraction des polices
            fonts = self._extract_fonts(soup)
            
            # Analyse des éléments interactifs
            interactive_elements = self._analyze_interactive_elements(soup)
            
            return {
                "colors": colors,
                "layout_structure": layout_structure,
                "fonts": fonts,
                "interactive_elements": interactive_elements,
                "responsive_indicators": self._check_responsive_indicators(soup)
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse de design: {e}")
            return {}

    async def _analyze_seo_elements(
        self, 
        html_content: str, 
        url: str
    ) -> Dict[str, Any]:
        """Analyse les éléments SEO d'une page"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Analyse des balises meta
            meta_analysis = self._analyze_meta_tags(soup)
            
            # Analyse de la structure des headings
            heading_structure = self._analyze_heading_structure(soup)
            
            # Analyse des liens internes/externes
            link_analysis = self._analyze_links(soup, url)
            
            # Analyse des images et alt text
            image_seo = self._analyze_image_seo(soup)
            
            # Analyse de la vitesse de chargement (estimation)
            performance_indicators = self._estimate_performance(soup)
            
            return {
                "meta_analysis": meta_analysis,
                "heading_structure": heading_structure,
                "link_analysis": link_analysis,
                "image_seo": image_seo,
                "performance_indicators": performance_indicators,
                "seo_score": self._calculate_seo_score(meta_analysis, heading_structure, image_seo)
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse SEO: {e}")
            return {}

    async def _generate_insights(
        self, 
        ai_analysis: Dict[str, Any],
        design_analysis: Dict[str, Any],
        seo_analysis: Dict[str, Any]
    ) -> List[str]:
        """Génère des insights basés sur l'analyse complète"""
        insights = []
        
        try:
            # Insights basés sur l'analyse IA
            if ai_analysis.get('competitive_advantages'):
                insights.append(f"Avantages concurrentiels identifiés: {', '.join(ai_analysis['competitive_advantages'][:3])}")
            
            # Insights basés sur le design
            if design_analysis.get('colors'):
                dominant_colors = design_analysis['colors'][:3]
                insights.append(f"Palette de couleurs dominante: {', '.join(dominant_colors)}")
            
            # Insights SEO
            seo_score = seo_analysis.get('seo_score', 0)
            if seo_score > 80:
                insights.append("Optimisation SEO excellente")
            elif seo_score > 60:
                insights.append("Optimisation SEO correcte avec des améliorations possibles")
            else:
                insights.append("Optimisation SEO à améliorer significativement")
            
            # Insights sur la stratégie de contenu
            if ai_analysis.get('content_strategy'):
                insights.append(f"Stratégie de contenu: {ai_analysis['content_strategy']}")
            
            return insights
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération d'insights: {e}")
            return []

    async def _generate_recommendations(
        self, 
        ai_analysis: Dict[str, Any],
        design_analysis: Dict[str, Any]
    ) -> List[str]:
        """Génère des recommandations d'amélioration"""
        recommendations = []
        
        try:
            # Recommandations basées sur l'analyse IA
            if ai_analysis.get('improvement_areas'):
                for area in ai_analysis['improvement_areas'][:3]:
                    recommendations.append(f"Améliorer: {area}")
            
            # Recommandations de design
            if not design_analysis.get('responsive_indicators'):
                recommendations.append("Implémenter un design responsive")
            
            # Recommandations générales
            recommendations.extend([
                "Optimiser la vitesse de chargement",
                "Améliorer l'expérience utilisateur mobile",
                "Renforcer les appels à l'action",
                "Optimiser le parcours de conversion"
            ])
            
            return recommendations[:10]  # Limiter à 10 recommandations
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de recommandations: {e}")
            return []

    def _extract_main_content(self, soup: BeautifulSoup) -> str:
        """Extrait le contenu textuel principal"""
        try:
            # Supprimer les éléments non pertinents
            for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
                element.decompose()
            
            # Chercher le contenu principal
            main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile(r'content|main'))
            
            if main_content:
                return main_content.get_text(separator=' ', strip=True)
            else:
                return soup.get_text(separator=' ', strip=True)
                
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction du contenu principal: {e}")
            return ""

    def _extract_json_ld(self, soup: BeautifulSoup) -> List[Dict]:
        """Extrait les données JSON-LD"""
        try:
            json_scripts = soup.find_all('script', type='application/ld+json')
            json_data = []
            
            for script in json_scripts:
                try:
                    data = json.loads(script.string)
                    json_data.append(data)
                except json.JSONDecodeError:
                    continue
            
            return json_data
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction JSON-LD: {e}")
            return []

    def _extract_colors(self, soup: BeautifulSoup) -> List[str]:
        """Extrait les couleurs utilisées dans le CSS"""
        colors = set()
        
        try:
            # Extraction depuis les styles inline
            for element in soup.find_all(style=True):
                style = element.get('style', '')
                color_matches = re.findall(r'#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}', style)
                colors.update(color_matches)
            
            # Extraction depuis les feuilles de style
            for style_tag in soup.find_all('style'):
                if style_tag.string:
                    color_matches = re.findall(r'#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}', style_tag.string)
                    colors.update(color_matches)
            
            return list(colors)[:10]  # Limiter à 10 couleurs
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction de couleurs: {e}")
            return []

    def _analyze_layout_structure(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyse la structure de layout"""
        try:
            structure = {
                "has_header": bool(soup.find(['header', 'div'], class_=re.compile(r'header'))),
                "has_footer": bool(soup.find(['footer', 'div'], class_=re.compile(r'footer'))),
                "has_sidebar": bool(soup.find(['aside', 'div'], class_=re.compile(r'sidebar'))),
                "has_navigation": bool(soup.find(['nav', 'div'], class_=re.compile(r'nav'))),
                "grid_layout": bool(soup.find_all(class_=re.compile(r'grid|col-'))),
                "flexbox_layout": bool(soup.find_all(style=re.compile(r'display:\s*flex')))
            }
            
            return structure
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse de layout: {e}")
            return {}

    def _extract_fonts(self, soup: BeautifulSoup) -> List[str]:
        """Extrait les polices utilisées"""
        fonts = set()
        
        try:
            # Extraction depuis Google Fonts
            for link in soup.find_all('link', href=re.compile(r'fonts\.googleapis\.com')):
                href = link.get('href', '')
                font_matches = re.findall(r'family=([^&:]+)', href)
                fonts.update(font_matches)
            
            # Extraction depuis les styles CSS
            for element in soup.find_all(style=True):
                style = element.get('style', '')
                font_matches = re.findall(r'font-family:\s*([^;]+)', style)
                fonts.update(font_matches)
            
            return list(fonts)[:5]  # Limiter à 5 polices
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction de polices: {e}")
            return []

    def _analyze_interactive_elements(self, soup: BeautifulSoup) -> Dict[str, int]:
        """Analyse les éléments interactifs"""
        try:
            return {
                "buttons": len(soup.find_all(['button', 'input'], type=['button', 'submit'])),
                "forms": len(soup.find_all('form')),
                "links": len(soup.find_all('a', href=True)),
                "inputs": len(soup.find_all(['input', 'textarea', 'select'])),
                "modals": len(soup.find_all(class_=re.compile(r'modal'))),
                "dropdowns": len(soup.find_all(['select', 'div'], class_=re.compile(r'dropdown')))
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse d'éléments interactifs: {e}")
            return {}

    def _check_responsive_indicators(self, soup: BeautifulSoup) -> bool:
        """Vérifie les indicateurs de design responsive"""
        try:
            # Vérifier la présence de viewport meta tag
            viewport = soup.find('meta', attrs={'name': 'viewport'})
            
            # Vérifier les classes CSS responsive
            responsive_classes = soup.find_all(class_=re.compile(r'responsive|mobile|tablet|desktop|sm-|md-|lg-|xl-'))
            
            # Vérifier les media queries dans les styles
            media_queries = False
            for style_tag in soup.find_all('style'):
                if style_tag.string and '@media' in style_tag.string:
                    media_queries = True
                    break
            
            return bool(viewport) or bool(responsive_classes) or media_queries
            
        except Exception as e:
            logger.error(f"Erreur lors de la vérification responsive: {e}")
            return False

    def _analyze_meta_tags(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyse les balises meta"""
        try:
            meta_data = {}
            
            # Title tag
            title = soup.find('title')
            meta_data['title'] = {
                'content': title.get_text().strip() if title else '',
                'length': len(title.get_text().strip()) if title else 0
            }
            
            # Meta description
            description = soup.find('meta', attrs={'name': 'description'})
            meta_data['description'] = {
                'content': description.get('content', '') if description else '',
                'length': len(description.get('content', '')) if description else 0
            }
            
            # Meta keywords
            keywords = soup.find('meta', attrs={'name': 'keywords'})
            meta_data['keywords'] = keywords.get('content', '') if keywords else ''
            
            # Open Graph tags
            og_tags = {}
            for og in soup.find_all('meta', property=re.compile(r'^og:')):
                og_tags[og.get('property')] = og.get('content', '')
            meta_data['open_graph'] = og_tags
            
            return meta_data
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse des meta tags: {e}")
            return {}

    def _analyze_heading_structure(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyse la structure des headings"""
        try:
            headings = {}
            for i in range(1, 7):
                h_tags = soup.find_all(f'h{i}')
                headings[f'h{i}'] = {
                    'count': len(h_tags),
                    'content': [h.get_text().strip() for h in h_tags[:5]]  # Limiter à 5
                }
            
            return headings
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse des headings: {e}")
            return {}

    def _analyze_links(self, soup: BeautifulSoup, base_url: str) -> Dict[str, Any]:
        """Analyse les liens internes et externes"""
        try:
            links = soup.find_all('a', href=True)
            internal_links = []
            external_links = []
            
            base_domain = urlparse(base_url).netloc
            
            for link in links:
                href = link.get('href', '')
                full_url = urljoin(base_url, href)
                link_domain = urlparse(full_url).netloc
                
                if link_domain == base_domain or not link_domain:
                    internal_links.append(full_url)
                else:
                    external_links.append(full_url)
            
            return {
                'internal_count': len(internal_links),
                'external_count': len(external_links),
                'total_count': len(links),
                'internal_links': internal_links[:10],  # Limiter à 10
                'external_links': external_links[:10]
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse des liens: {e}")
            return {}

    def _analyze_image_seo(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Analyse le SEO des images"""
        try:
            images = soup.find_all('img')
            
            total_images = len(images)
            images_with_alt = len([img for img in images if img.get('alt')])
            images_with_title = len([img for img in images if img.get('title')])
            
            return {
                'total_images': total_images,
                'images_with_alt': images_with_alt,
                'images_with_title': images_with_title,
                'alt_text_coverage': (images_with_alt / total_images * 100) if total_images > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse SEO des images: {e}")
            return {}

    def _estimate_performance(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Estime les indicateurs de performance"""
        try:
            # Compter les ressources externes
            external_scripts = len(soup.find_all('script', src=True))
            external_styles = len(soup.find_all('link', rel='stylesheet'))
            images = len(soup.find_all('img'))
            
            # Estimer la taille du HTML
            html_size = len(str(soup))
            
            return {
                'external_scripts': external_scripts,
                'external_styles': external_styles,
                'total_images': images,
                'estimated_html_size': html_size,
                'performance_score': self._calculate_performance_score(
                    external_scripts, external_styles, images, html_size
                )
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'estimation de performance: {e}")
            return {}

    def _calculate_seo_score(
        self, 
        meta_analysis: Dict[str, Any],
        heading_structure: Dict[str, Any],
        image_seo: Dict[str, Any]
    ) -> float:
        """Calcule un score SEO basique"""
        try:
            score = 0
            
            # Score pour le title
            title_length = meta_analysis.get('title', {}).get('length', 0)
            if 30 <= title_length <= 60:
                score += 20
            elif title_length > 0:
                score += 10
            
            # Score pour la description
            desc_length = meta_analysis.get('description', {}).get('length', 0)
            if 120 <= desc_length <= 160:
                score += 20
            elif desc_length > 0:
                score += 10
            
            # Score pour les headings
            if heading_structure.get('h1', {}).get('count', 0) == 1:
                score += 15
            if heading_structure.get('h2', {}).get('count', 0) > 0:
                score += 10
            
            # Score pour les images
            alt_coverage = image_seo.get('alt_text_coverage', 0)
            if alt_coverage >= 90:
                score += 20
            elif alt_coverage >= 70:
                score += 15
            elif alt_coverage >= 50:
                score += 10
            
            # Score pour les liens
            score += 15  # Score de base pour la présence de liens
            
            return min(score, 100)  # Limiter à 100
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul du score SEO: {e}")
            return 0

    def _calculate_performance_score(
        self, 
        scripts: int, 
        styles: int, 
        images: int, 
        html_size: int
    ) -> float:
        """Calcule un score de performance estimé"""
        try:
            score = 100
            
            # Pénalités pour les ressources externes
            score -= min(scripts * 2, 20)  # Max 20 points de pénalité
            score -= min(styles * 3, 15)   # Max 15 points de pénalité
            score -= min(images * 0.5, 25) # Max 25 points de pénalité
            
            # Pénalité pour la taille HTML
            if html_size > 100000:  # 100KB
                score -= 20
            elif html_size > 50000:  # 50KB
                score -= 10
            
            return max(score, 0)  # Minimum 0
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul du score de performance: {e}")
            return 50  # Score par défaut

    async def __aenter__(self):
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

