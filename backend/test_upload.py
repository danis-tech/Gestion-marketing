#!/usr/bin/env python3
"""
Script de test pour l'upload de photo
"""
import os
import requests
import json

def test_upload():
    # URL de l'API
    url = "http://127.0.0.1:8000/api/accounts/upload-photo/"
    
    # Créer un fichier de test
    test_file_path = "test_image.txt"
    with open(test_file_path, "w") as f:
        f.write("Test content")
    
    try:
        # Préparer les données
        files = {'photo': open(test_file_path, 'rb')}
        headers = {
            'Authorization': 'Bearer test-token'  # Token de test
        }
        
        # Faire la requête
        response = requests.post(url, files=files, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            photo_url = result.get('photo_url')
            print(f"Photo URL: {photo_url}")
            
            # Tester l'accès à l'URL
            if photo_url:
                media_response = requests.get(f"http://127.0.0.1:8000{photo_url}")
                print(f"Media access status: {media_response.status_code}")
        
    except Exception as e:
        print(f"Erreur: {e}")
    finally:
        # Nettoyer
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
        if 'files' in locals():
            files['photo'].close()

if __name__ == "__main__":
    test_upload()
