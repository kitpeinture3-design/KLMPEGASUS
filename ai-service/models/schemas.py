from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime

class IndustryType(str, Enum):
    FASHION = "Mode & Vêtements"
    ELECTRONICS = "Électronique & Technologie"
    HEALTH_BEAUTY = "Santé & Beauté"
    HOME_GARDEN = "Maison & Jardin"
    SPORTS_FITNESS = "Sport & Fitness"
    FOOD_BEVERAGE = "Alimentation & Boissons"
    BOOKS_MEDIA = "Livres & Médias"
    JEWELRY = "Bijoux & Accessoires"
    ART_CRAFTS = "Art & Artisanat"
    OTHER = "Autre"

class StylePreference(str, Enum):
    MODERN = "moderne"
    CLASSIC = "classique"
    MINIMALIST = "minimaliste"
    BOLD = "audacieux"
    ELEGANT = "élégant"
    PLAYFUL = "ludique"
    PROFESSIONAL = "professionnel"

class ColorScheme(BaseModel):
    primary: str = Field(..., description="Couleur principale en hex")
    secondary: str = Field(..., description="Couleur secondaire en hex")
    accent: str = Field(..., description="Couleur d'accent en hex")
    background: str = Field(..., description="Couleur de fond en hex")
    text: str = Field(..., description="Couleur du texte en hex")

class Typography(BaseModel):
    heading_font: str = Field(..., description="Police pour les titres")
    body_font: str = Field(..., description="Police pour le corps de texte")
    font_sizes: Dict[str, str] = Field(..., description="Tailles de police")

class BrandingData(BaseModel):
    logo_url: Optional[str] = None
    color_scheme: ColorScheme
    typography: Typography
    brand_voice: str = Field(..., description="Ton de la marque")
    brand_values: List[str] = Field(..., description="Valeurs de la marque")
    tagline: str = Field(..., description="Slogan de la marque")

class SiteGenerationRequest(BaseModel):
    user_id: str = Field(..., description="ID de l'utilisateur")
    business_name: str = Field(..., min_length=1, max_length=100)
    industry: IndustryType
    description: str = Field(..., min_length=10, max_length=1000)
    target_audience: str = Field(..., min_length=5, max_length=500)
    competitor_urls: Optional[List[str]] = Field(default=[], max_items=5)
    style_preferences: Optional[List[StylePreference]] = Field(default=[])
    color_preferences: Optional[List[str]] = Field(default=[])
    features_required: Optional[List[str]] = Field(default=[])
    budget_range: Optional[str] = None
    launch_timeline: Optional[str] = None

    @validator('competitor_urls')
    def validate_urls(cls, v):
        if v:
            for url in v:
                if not url.startswith(('http://', 'https://')):
                    raise ValueError(f"URL invalide: {url}")
        return v

class BrandingRequest(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=100)
    industry: IndustryType
    style_preferences: Optional[List[StylePreference]] = Field(default=[])
    color_preferences: Optional[List[str]] = Field(default=[])
    brand_personality: Optional[str] = None
    target_demographic: Optional[str] = None

class ContentAnalysisRequest(BaseModel):
    url: str = Field(..., description="URL du site à analyser")
    analysis_type: str = Field(default="complete", description="Type d'analyse")
    focus_areas: Optional[List[str]] = Field(default=[])

    @validator('url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError("URL doit commencer par http:// ou https://")
        return v

class PageStructure(BaseModel):
    page_id: str
    page_name: str
    page_type: str  # home, product, about, contact, etc.
    sections: List[Dict[str, Any]]
    meta_data: Dict[str, str]
    seo_data: Dict[str, str]

class SiteStructure(BaseModel):
    site_id: str
    pages: List[PageStructure]
    navigation: Dict[str, Any]
    global_settings: Dict[str, Any]
    integrations: List[str]

class AssetData(BaseModel):
    asset_id: str
    asset_type: str  # logo, image, icon, etc.
    url: str
    alt_text: Optional[str] = None
    dimensions: Optional[Dict[str, int]] = None
    file_size: Optional[int] = None

class SiteGenerationResponse(BaseModel):
    success: bool
    site_id: str
    preview_url: str
    branding: BrandingData
    structure: SiteStructure
    assets: List[AssetData]
    estimated_completion_time: int  # en secondes
    message: Optional[str] = None

class BrandingResponse(BaseModel):
    success: bool
    branding: BrandingData
    message: Optional[str] = None

class ContentOptimization(BaseModel):
    original_content: str
    optimized_content: str
    improvements: List[str]
    seo_score: Optional[float] = None
    readability_score: Optional[float] = None

class AIInsight(BaseModel):
    insight_type: str
    title: str
    description: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    actionable_recommendations: List[str]

class CompetitorAnalysis(BaseModel):
    competitor_url: str
    business_name: Optional[str] = None
    industry_category: Optional[str] = None
    key_features: List[str]
    pricing_strategy: Optional[str] = None
    content_themes: List[str]
    design_elements: Dict[str, Any]
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]

class MarketInsights(BaseModel):
    industry_trends: List[str]
    target_audience_insights: Dict[str, Any]
    competitive_landscape: List[CompetitorAnalysis]
    recommended_features: List[str]
    pricing_recommendations: Dict[str, Any]

class SiteStatus(BaseModel):
    site_id: str
    status: str  # generating, completed, error, deployed
    progress_percentage: float = Field(..., ge=0.0, le=100.0)
    current_step: str
    estimated_time_remaining: Optional[int] = None  # en secondes
    error_message: Optional[str] = None
    last_updated: datetime

class GenerationStep(BaseModel):
    step_name: str
    step_description: str
    status: str  # pending, in_progress, completed, error
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    output_data: Optional[Dict[str, Any]] = None

class SiteGenerationProgress(BaseModel):
    site_id: str
    user_id: str
    steps: List[GenerationStep]
    overall_progress: float = Field(..., ge=0.0, le=100.0)
    created_at: datetime
    updated_at: datetime

# Modèles pour les réponses d'erreur
class ErrorResponse(BaseModel):
    success: bool = False
    error_code: str
    error_message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now)

# Modèles pour les webhooks
class WebhookEvent(BaseModel):
    event_type: str
    site_id: str
    user_id: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)

class DeploymentConfig(BaseModel):
    domain_name: Optional[str] = None
    ssl_enabled: bool = True
    cdn_enabled: bool = True
    analytics_enabled: bool = True
    custom_code: Optional[str] = None
    environment_variables: Optional[Dict[str, str]] = None

