from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import asyncio
import logging
from datetime import datetime

# Import des modules personnalisés
from services.ai_generator import AIGenerator
from services.brand_generator import BrandGenerator
from services.content_scraper import ContentScraper
from services.site_builder import SiteBuilder
from services.asset_manager import AssetManager
from models.schemas import (
    SiteGenerationRequest,
    BrandingRequest,
    ContentAnalysisRequest,
    SiteGenerationResponse,
    BrandingResponse
)

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialisation de l'application FastAPI
app = FastAPI(
    title="KLM Pegasus AI Service",
    description="Service IA pour la génération automatique de sites e-commerce",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation des services
ai_generator = AIGenerator()
brand_generator = BrandGenerator()
content_scraper = ContentScraper()
site_builder = SiteBuilder()
asset_manager = AssetManager()

@app.on_event("startup")
async def startup_event():
    """Initialisation des services au démarrage"""
    logger.info("Démarrage du service IA KLM Pegasus")
    await ai_generator.initialize()
    await brand_generator.initialize()
    logger.info("Services IA initialisés avec succès")

@app.get("/")
async def root():
    """Point d'entrée racine"""
    return {
        "message": "Service IA KLM Pegasus",
        "version": "1.0.0",
        "status": "actif",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Vérification de l'état de santé du service"""
    return {
        "status": "healthy",
        "services": {
            "ai_generator": "active",
            "brand_generator": "active",
            "content_scraper": "active",
            "site_builder": "active",
            "asset_manager": "active"
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/generate-site", response_model=SiteGenerationResponse)
async def generate_site(request: SiteGenerationRequest, background_tasks: BackgroundTasks):
    """
    Génère un site e-commerce complet basé sur les informations fournies
    """
    try:
        logger.info(f"Génération de site pour: {request.business_name}")
        
        # Étape 1: Analyse du secteur d'activité et génération du branding
        branding_data = await brand_generator.generate_branding(
            business_name=request.business_name,
            industry=request.industry,
            description=request.description,
            target_audience=request.target_audience
        )
        
        # Étape 2: Génération du contenu et de la structure du site
        site_structure = await ai_generator.generate_site_structure(
            business_info=request,
            branding=branding_data
        )
        
        # Étape 3: Génération des assets (images, logos)
        assets = await asset_manager.generate_assets(
            branding_data=branding_data,
            site_structure=site_structure
        )
        
        # Étape 4: Construction du site final
        site_data = await site_builder.build_site(
            structure=site_structure,
            branding=branding_data,
            assets=assets
        )
        
        # Étape 5: Sauvegarde et déploiement en arrière-plan
        background_tasks.add_task(
            save_and_deploy_site,
            site_data,
            request.user_id
        )
        
        return SiteGenerationResponse(
            success=True,
            site_id=site_data["site_id"],
            preview_url=site_data["preview_url"],
            branding=branding_data,
            structure=site_structure,
            assets=assets,
            estimated_completion_time=300  # 5 minutes
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération du site: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de génération: {str(e)}")

@app.post("/generate-branding", response_model=BrandingResponse)
async def generate_branding(request: BrandingRequest):
    """
    Génère un branding complet (logo, couleurs, typographie) pour une entreprise
    """
    try:
        logger.info(f"Génération de branding pour: {request.business_name}")
        
        branding_data = await brand_generator.generate_complete_branding(
            business_name=request.business_name,
            industry=request.industry,
            style_preferences=request.style_preferences,
            color_preferences=request.color_preferences
        )
        
        return BrandingResponse(
            success=True,
            branding=branding_data
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération du branding: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de branding: {str(e)}")

@app.post("/analyze-content")
async def analyze_content(request: ContentAnalysisRequest):
    """
    Analyse le contenu d'un site web concurrent pour extraire des insights
    """
    try:
        logger.info(f"Analyse de contenu pour: {request.url}")
        
        analysis = await content_scraper.analyze_website(
            url=request.url,
            analysis_type=request.analysis_type
        )
        
        return {
            "success": True,
            "analysis": analysis,
            "insights": analysis.get("insights", []),
            "recommendations": analysis.get("recommendations", [])
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse de contenu: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur d'analyse: {str(e)}")

@app.post("/upload-assets")
async def upload_assets(
    files: List[UploadFile] = File(...),
    site_id: str = Form(...),
    asset_type: str = Form(...)
):
    """
    Upload et traitement d'assets (images, logos, etc.)
    """
    try:
        logger.info(f"Upload d'assets pour le site: {site_id}")
        
        uploaded_assets = []
        for file in files:
            asset_url = await asset_manager.upload_asset(
                file=file,
                site_id=site_id,
                asset_type=asset_type
            )
            uploaded_assets.append({
                "filename": file.filename,
                "url": asset_url,
                "type": asset_type
            })
        
        return {
            "success": True,
            "assets": uploaded_assets,
            "message": f"{len(uploaded_assets)} assets uploadés avec succès"
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'upload d'assets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur d'upload: {str(e)}")

@app.post("/optimize-content")
async def optimize_content(
    content: str = Form(...),
    optimization_type: str = Form(...),
    target_keywords: Optional[str] = Form(None)
):
    """
    Optimise le contenu pour le SEO et la conversion
    """
    try:
        logger.info(f"Optimisation de contenu: {optimization_type}")
        
        optimized_content = await ai_generator.optimize_content(
            content=content,
            optimization_type=optimization_type,
            target_keywords=target_keywords.split(",") if target_keywords else []
        )
        
        return {
            "success": True,
            "original_content": content,
            "optimized_content": optimized_content,
            "improvements": optimized_content.get("improvements", [])
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de l'optimisation de contenu: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur d'optimisation: {str(e)}")

@app.get("/site/{site_id}/status")
async def get_site_status(site_id: str):
    """
    Récupère le statut de génération d'un site
    """
    try:
        status = await site_builder.get_site_status(site_id)
        return {
            "success": True,
            "site_id": site_id,
            "status": status
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du statut: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de statut: {str(e)}")

async def save_and_deploy_site(site_data: Dict[str, Any], user_id: str):
    """
    Sauvegarde et déploie le site en arrière-plan
    """
    try:
        logger.info(f"Sauvegarde et déploiement du site pour l'utilisateur: {user_id}")
        
        # Sauvegarde en base de données
        await site_builder.save_site_to_database(site_data, user_id)
        
        # Déploiement sur CDN
        await site_builder.deploy_site(site_data)
        
        logger.info(f"Site déployé avec succès: {site_data['site_id']}")
        
    except Exception as e:
        logger.error(f"Erreur lors du déploiement: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

