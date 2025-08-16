import asyncio
import aiofiles
import aiohttp
import boto3
import logging
import uuid
import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import io
import base64
from fastapi import UploadFile
from models.schemas import AssetData, BrandingData, SiteStructure

logger = logging.getLogger(__name__)

class AssetManager:
    """Service de gestion des assets (images, logos, etc.)"""
    
    def __init__(self):
        self.s3_client = None
        self.bucket_name = os.getenv('AWS_S3_BUCKET', 'klm-pegasus-assets')
        self.cdn_base_url = os.getenv('CDN_BASE_URL', 'https://cdn.klmpegasus.com')
        self.local_storage_path = '/tmp/assets'
        
        # Configuration pour la génération d'images
        self.image_sizes = {
            'logo': (200, 80),
            'hero': (1200, 600),
            'product': (400, 400),
            'thumbnail': (150, 150),
            'banner': (1200, 300)
        }
        
    async def initialize(self):
        """Initialise le service de gestion des assets"""
        try:
            # Initialisation du client S3
            if os.getenv('AWS_ACCESS_KEY_ID'):
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                    region_name=os.getenv('AWS_REGION', 'eu-west-1')
                )
            
            # Création du dossier local si nécessaire
            os.makedirs(self.local_storage_path, exist_ok=True)
            
            logger.info("Service de gestion des assets initialisé avec succès")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation des assets: {e}")
            raise

    async def generate_assets(
        self,
        branding_data: BrandingData,
        site_structure: SiteStructure
    ) -> List[AssetData]:
        """
        Génère tous les assets nécessaires pour un site
        """
        try:
            logger.info(f"Génération des assets pour le site: {site_structure.site_id}")
            
            generated_assets = []
            
            # Génération du logo
            logo_asset = await self._generate_logo(
                site_structure.site_id,
                branding_data
            )
            if logo_asset:
                generated_assets.append(logo_asset)
            
            # Génération des images hero
            hero_assets = await self._generate_hero_images(
                site_structure.site_id,
                branding_data,
                site_structure
            )
            generated_assets.extend(hero_assets)
            
            # Génération des images de produits placeholder
            product_assets = await self._generate_product_placeholders(
                site_structure.site_id,
                branding_data
            )
            generated_assets.extend(product_assets)
            
            # Génération des icônes
            icon_assets = await self._generate_icons(
                site_structure.site_id,
                branding_data
            )
            generated_assets.extend(icon_assets)
            
            logger.info(f"Génération terminée: {len(generated_assets)} assets créés")
            return generated_assets
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération d'assets: {e}")
            raise

    async def upload_asset(
        self,
        file: UploadFile,
        site_id: str,
        asset_type: str
    ) -> str:
        """
        Upload un asset vers le stockage
        """
        try:
            logger.info(f"Upload d'asset: {file.filename} pour le site {site_id}")
            
            # Génération d'un nom de fichier unique
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{site_id}/{asset_type}/{uuid.uuid4()}{file_extension}"
            
            # Lecture du contenu du fichier
            content = await file.read()
            
            # Upload vers S3 ou stockage local
            asset_url = await self._upload_to_storage(unique_filename, content, file.content_type)
            
            logger.info(f"Asset uploadé avec succès: {asset_url}")
            return asset_url
            
        except Exception as e:
            logger.error(f"Erreur lors de l'upload d'asset: {e}")
            raise

    async def optimize_image(
        self,
        image_path: str,
        optimization_type: str = "web"
    ) -> str:
        """
        Optimise une image pour le web
        """
        try:
            logger.info(f"Optimisation de l'image: {image_path}")
            
            # Chargement de l'image
            if image_path.startswith('http'):
                # Image distante
                async with aiohttp.ClientSession() as session:
                    async with session.get(image_path) as response:
                        image_data = await response.read()
                        image = Image.open(io.BytesIO(image_data))
            else:
                # Image locale
                image = Image.open(image_path)
            
            # Optimisation selon le type
            if optimization_type == "web":
                # Redimensionnement si trop grande
                max_size = (1200, 1200)
                image.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Conversion en RGB si nécessaire
                if image.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    if image.mode == 'P':
                        image = image.convert('RGBA')
                    background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                    image = background
            
            # Sauvegarde optimisée
            optimized_path = f"{self.local_storage_path}/optimized_{uuid.uuid4()}.jpg"
            image.save(optimized_path, 'JPEG', quality=85, optimize=True)
            
            # Upload de l'image optimisée
            with open(optimized_path, 'rb') as f:
                content = f.read()
            
            optimized_url = await self._upload_to_storage(
                f"optimized/{uuid.uuid4()}.jpg",
                content,
                "image/jpeg"
            )
            
            # Nettoyage du fichier temporaire
            os.remove(optimized_path)
            
            return optimized_url
            
        except Exception as e:
            logger.error(f"Erreur lors de l'optimisation d'image: {e}")
            raise

    async def generate_favicon(
        self,
        site_id: str,
        branding_data: BrandingData
    ) -> str:
        """
        Génère un favicon pour le site
        """
        try:
            logger.info(f"Génération du favicon pour le site: {site_id}")
            
            # Création d'une image 32x32 avec les couleurs de la marque
            favicon = Image.new('RGB', (32, 32), branding_data.color_scheme.primary)
            draw = ImageDraw.Draw(favicon)
            
            # Ajout d'un élément graphique simple
            draw.ellipse([8, 8, 24, 24], fill=branding_data.color_scheme.accent)
            
            # Sauvegarde temporaire
            favicon_path = f"{self.local_storage_path}/favicon_{site_id}.ico"
            favicon.save(favicon_path, 'ICO')
            
            # Upload
            with open(favicon_path, 'rb') as f:
                content = f.read()
            
            favicon_url = await self._upload_to_storage(
                f"{site_id}/favicon.ico",
                content,
                "image/x-icon"
            )
            
            # Nettoyage
            os.remove(favicon_path)
            
            return favicon_url
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du favicon: {e}")
            raise

    async def _generate_logo(
        self,
        site_id: str,
        branding_data: BrandingData
    ) -> Optional[AssetData]:
        """Génère un logo simple pour la marque"""
        try:
            # Pour l'instant, génération d'un logo textuel simple
            # Dans une implémentation complète, ceci utiliserait un service de génération d'images IA
            
            logo_width, logo_height = self.image_sizes['logo']
            logo = Image.new('RGBA', (logo_width, logo_height), (255, 255, 255, 0))
            draw = ImageDraw.Draw(logo)
            
            # Couleurs de la marque
            primary_color = branding_data.color_scheme.primary
            
            # Dessin d'un rectangle de fond
            draw.rectangle([10, 20, logo_width-10, logo_height-20], fill=primary_color)
            
            # Ajout du nom de l'entreprise (simplifié)
            # Note: Dans un vrai projet, utiliser une police personnalisée
            business_name = "LOGO"  # Placeholder
            
            # Calcul de la position du texte
            text_bbox = draw.textbbox((0, 0), business_name)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
            
            text_x = (logo_width - text_width) // 2
            text_y = (logo_height - text_height) // 2
            
            draw.text((text_x, text_y), business_name, fill="white")
            
            # Sauvegarde temporaire
            logo_path = f"{self.local_storage_path}/logo_{site_id}.png"
            logo.save(logo_path, 'PNG')
            
            # Upload
            with open(logo_path, 'rb') as f:
                content = f.read()
            
            logo_url = await self._upload_to_storage(
                f"{site_id}/logo.png",
                content,
                "image/png"
            )
            
            # Nettoyage
            os.remove(logo_path)
            
            return AssetData(
                asset_id=f"logo_{site_id}",
                asset_type="logo",
                url=logo_url,
                alt_text="Logo de l'entreprise",
                dimensions={"width": logo_width, "height": logo_height}
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du logo: {e}")
            return None

    async def _generate_hero_images(
        self,
        site_id: str,
        branding_data: BrandingData,
        site_structure: SiteStructure
    ) -> List[AssetData]:
        """Génère les images hero pour le site"""
        try:
            hero_assets = []
            
            # Génération d'une image hero principale
            hero_width, hero_height = self.image_sizes['hero']
            hero_image = Image.new('RGB', (hero_width, hero_height), branding_data.color_scheme.secondary)
            draw = ImageDraw.Draw(hero_image)
            
            # Gradient simple (simulation)
            for y in range(hero_height):
                alpha = y / hero_height
                # Interpolation entre couleur primaire et secondaire
                draw.line([(0, y), (hero_width, y)], fill=branding_data.color_scheme.primary)
            
            # Overlay semi-transparent
            overlay = Image.new('RGBA', (hero_width, hero_height), (0, 0, 0, 100))
            hero_image = Image.alpha_composite(hero_image.convert('RGBA'), overlay)
            
            # Sauvegarde et upload
            hero_path = f"{self.local_storage_path}/hero_{site_id}.jpg"
            hero_image.convert('RGB').save(hero_path, 'JPEG', quality=90)
            
            with open(hero_path, 'rb') as f:
                content = f.read()
            
            hero_url = await self._upload_to_storage(
                f"{site_id}/hero.jpg",
                content,
                "image/jpeg"
            )
            
            os.remove(hero_path)
            
            hero_assets.append(AssetData(
                asset_id=f"hero_{site_id}",
                asset_type="hero",
                url=hero_url,
                alt_text="Image hero principale",
                dimensions={"width": hero_width, "height": hero_height}
            ))
            
            return hero_assets
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération des images hero: {e}")
            return []

    async def _generate_product_placeholders(
        self,
        site_id: str,
        branding_data: BrandingData
    ) -> List[AssetData]:
        """Génère des images placeholder pour les produits"""
        try:
            product_assets = []
            product_width, product_height = self.image_sizes['product']
            
            # Génération de 6 images produits placeholder
            for i in range(6):
                product_image = Image.new('RGB', (product_width, product_height), branding_data.color_scheme.background)
                draw = ImageDraw.Draw(product_image)
                
                # Bordure
                draw.rectangle([0, 0, product_width-1, product_height-1], outline=branding_data.color_scheme.primary, width=2)
                
                # Texte placeholder
                text = f"PRODUIT {i+1}"
                text_bbox = draw.textbbox((0, 0), text)
                text_width = text_bbox[2] - text_bbox[0]
                text_height = text_bbox[3] - text_bbox[1]
                
                text_x = (product_width - text_width) // 2
                text_y = (product_height - text_height) // 2
                
                draw.text((text_x, text_y), text, fill=branding_data.color_scheme.text)
                
                # Sauvegarde et upload
                product_path = f"{self.local_storage_path}/product_{site_id}_{i}.jpg"
                product_image.save(product_path, 'JPEG', quality=85)
                
                with open(product_path, 'rb') as f:
                    content = f.read()
                
                product_url = await self._upload_to_storage(
                    f"{site_id}/products/product_{i}.jpg",
                    content,
                    "image/jpeg"
                )
                
                os.remove(product_path)
                
                product_assets.append(AssetData(
                    asset_id=f"product_{site_id}_{i}",
                    asset_type="product",
                    url=product_url,
                    alt_text=f"Image produit {i+1}",
                    dimensions={"width": product_width, "height": product_height}
                ))
            
            return product_assets
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération des placeholders produits: {e}")
            return []

    async def _generate_icons(
        self,
        site_id: str,
        branding_data: BrandingData
    ) -> List[AssetData]:
        """Génère des icônes pour le site"""
        try:
            icon_assets = []
            icon_names = ['shipping', 'support', 'security', 'quality']
            
            for icon_name in icon_names:
                # Génération d'icône simple 64x64
                icon = Image.new('RGBA', (64, 64), (255, 255, 255, 0))
                draw = ImageDraw.Draw(icon)
                
                # Cercle de fond
                draw.ellipse([8, 8, 56, 56], fill=branding_data.color_scheme.accent)
                
                # Forme simple au centre
                draw.ellipse([24, 24, 40, 40], fill="white")
                
                # Sauvegarde et upload
                icon_path = f"{self.local_storage_path}/icon_{icon_name}_{site_id}.png"
                icon.save(icon_path, 'PNG')
                
                with open(icon_path, 'rb') as f:
                    content = f.read()
                
                icon_url = await self._upload_to_storage(
                    f"{site_id}/icons/{icon_name}.png",
                    content,
                    "image/png"
                )
                
                os.remove(icon_path)
                
                icon_assets.append(AssetData(
                    asset_id=f"icon_{icon_name}_{site_id}",
                    asset_type="icon",
                    url=icon_url,
                    alt_text=f"Icône {icon_name}",
                    dimensions={"width": 64, "height": 64}
                ))
            
            return icon_assets
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération des icônes: {e}")
            return []

    async def _upload_to_storage(
        self,
        file_path: str,
        content: bytes,
        content_type: str
    ) -> str:
        """Upload un fichier vers le stockage (S3 ou local)"""
        try:
            if self.s3_client:
                # Upload vers S3
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=file_path,
                    Body=content,
                    ContentType=content_type,
                    ACL='public-read'
                )
                return f"https://{self.bucket_name}.s3.amazonaws.com/{file_path}"
            else:
                # Stockage local
                local_path = os.path.join(self.local_storage_path, file_path)
                os.makedirs(os.path.dirname(local_path), exist_ok=True)
                
                async with aiofiles.open(local_path, 'wb') as f:
                    await f.write(content)
                
                return f"{self.cdn_base_url}/{file_path}"
                
        except Exception as e:
            logger.error(f"Erreur lors de l'upload vers le stockage: {e}")
            raise

    async def download_and_process_image(
        self,
        image_url: str,
        processing_options: Dict[str, Any] = None
    ) -> str:
        """Télécharge et traite une image externe"""
        try:
            logger.info(f"Téléchargement et traitement de l'image: {image_url}")
            
            # Téléchargement de l'image
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as response:
                    if response.status == 200:
                        image_data = await response.read()
                        image = Image.open(io.BytesIO(image_data))
                    else:
                        raise Exception(f"Erreur de téléchargement: {response.status}")
            
            # Traitement selon les options
            if processing_options:
                if 'resize' in processing_options:
                    size = processing_options['resize']
                    image = image.resize(size, Image.Resampling.LANCZOS)
                
                if 'crop' in processing_options:
                    crop_box = processing_options['crop']
                    image = image.crop(crop_box)
                
                if 'format' in processing_options:
                    # Conversion de format si nécessaire
                    if processing_options['format'].upper() == 'JPEG' and image.mode in ('RGBA', 'LA', 'P'):
                        background = Image.new('RGB', image.size, (255, 255, 255))
                        if image.mode == 'P':
                            image = image.convert('RGBA')
                        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                        image = background
            
            # Sauvegarde temporaire
            processed_path = f"{self.local_storage_path}/processed_{uuid.uuid4()}.jpg"
            image.save(processed_path, 'JPEG', quality=85)
            
            # Upload
            with open(processed_path, 'rb') as f:
                content = f.read()
            
            processed_url = await self._upload_to_storage(
                f"processed/{uuid.uuid4()}.jpg",
                content,
                "image/jpeg"
            )
            
            # Nettoyage
            os.remove(processed_path)
            
            return processed_url
            
        except Exception as e:
            logger.error(f"Erreur lors du téléchargement et traitement: {e}")
            raise

    async def cleanup_assets(self, site_id: str):
        """Nettoie les assets d'un site supprimé"""
        try:
            logger.info(f"Nettoyage des assets pour le site: {site_id}")
            
            if self.s3_client:
                # Suppression des objets S3
                response = self.s3_client.list_objects_v2(
                    Bucket=self.bucket_name,
                    Prefix=f"{site_id}/"
                )
                
                if 'Contents' in response:
                    objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
                    
                    if objects_to_delete:
                        self.s3_client.delete_objects(
                            Bucket=self.bucket_name,
                            Delete={'Objects': objects_to_delete}
                        )
            else:
                # Suppression locale
                site_path = os.path.join(self.local_storage_path, site_id)
                if os.path.exists(site_path):
                    import shutil
                    shutil.rmtree(site_path)
            
            logger.info(f"Assets nettoyés pour le site: {site_id}")
            
        except Exception as e:
            logger.error(f"Erreur lors du nettoyage des assets: {e}")

    def get_asset_url(self, site_id: str, asset_type: str, asset_name: str) -> str:
        """Génère l'URL d'un asset"""
        if self.s3_client:
            return f"https://{self.bucket_name}.s3.amazonaws.com/{site_id}/{asset_type}/{asset_name}"
        else:
            return f"{self.cdn_base_url}/{site_id}/{asset_type}/{asset_name}"

