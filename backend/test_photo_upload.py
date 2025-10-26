#!/usr/bin/env python3
"""
Test d'upload de photo avec un vrai fichier image
"""
import os
import requests
import base64

def create_test_image():
    """Créer une image de test simple (1x1 pixel PNG)"""
    # PNG de 1x1 pixel transparent
    png_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
    
    with open('test_image.png', 'wb') as f:
        f.write(png_data)
    
    return 'test_image.png'

def test_photo_upload():
    # Créer une image de test
    image_path = create_test_image()
    
    try:
        # URL de l'API
        url = "http://127.0.0.1:8000/api/accounts/upload-photo/"
        
        # Préparer les données
        with open(image_path, 'rb') as f:
            files = {'photo': f}
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
                    # Extraire le chemin relatif
                    if '/media/' in photo_url:
                        media_path = photo_url.split('/media/')[1]
                        media_url = f"http://127.0.0.1:8000/media/{media_path}"
                        print(f"Media URL: {media_url}")
                        
                        media_response = requests.get(media_url)
                        print(f"Media access status: {media_response.status_code}")
                        if media_response.status_code == 200:
                            print("✅ Fichier médias accessible !")
                        else:
                            print("❌ Fichier médias non accessible")
    
    except Exception as e:
        print(f"Erreur: {e}")
    finally:
        # Nettoyer
        if os.path.exists(image_path):
            os.remove(image_path)

if __name__ == "__main__":
    test_photo_upload()
