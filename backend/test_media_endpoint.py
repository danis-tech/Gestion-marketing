#!/usr/bin/env python3
"""
Test de l'endpoint de médias
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion.settings')
django.setup()

from django.test import RequestFactory
from accounts.views import MediaFileView
from django.conf import settings

def test_media_endpoint():
    # Créer une requête factice
    factory = RequestFactory()
    request = factory.get('/api/accounts/media/photoUser/2cfa0cb6-fc4c-4aaf-a816-78dee0c93bac.jpg')
    
    # Créer la vue
    view = MediaFileView()
    
    # Tester la vue
    try:
        response = view.get(request, path='photoUser/2cfa0cb6-fc4c-4aaf-a816-78dee0c93bac.jpg')
        print(f"Status Code: {response.status_code}")
        print(f"Response type: {type(response)}")
        if hasattr(response, 'status_code') and response.status_code == 200:
            print("✅ Vue fonctionne correctement")
        else:
            print(f"❌ Vue retourne: {response}")
    except Exception as e:
        print(f"Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_media_endpoint()
