#!/usr/bin/env python3
"""
Test de la vue MediaFileView
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

def test_media_view():
    # Créer une requête factice
    factory = RequestFactory()
    request = factory.get('/api/accounts/media/photoUser/test.txt')
    
    # Créer la vue
    view = MediaFileView()
    
    # Tester la vue
    try:
        response = view.get(request, path='photoUser/test.txt')
        print(f"Status Code: {response.status_code}")
        if hasattr(response, 'content'):
            print(f"Content: {response.content}")
        else:
            print(f"Response: {response}")
    except Exception as e:
        print(f"Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_media_view()
