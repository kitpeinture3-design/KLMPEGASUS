# content_scraper.py

import os
from dotenv import load_dotenv
import openai

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

class ContentScraper:
    def __init__(self):
        # Récupérer la clé API depuis l'environnement
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("La clé API OpenAI n'est pas définie dans le fichier .env")

        # Initialiser le client OpenAI avec la clé
        self.client = openai.OpenAI(api_key=api_key)

    def generate_text(self, prompt: str):
        # Exemple de fonction pour générer du texte avec OpenAI
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500
        )
        return response.choices[0].message.content
