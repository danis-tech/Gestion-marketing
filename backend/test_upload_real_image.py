#!/usr/bin/env python3
"""
Test d'upload de photo avec une vraie image
"""
import os
import requests
from PIL import Image
import io

def create_test_image():
    """Créer une vraie image de test"""
    # Créer une image 100x100 pixels avec une couleur
    img = Image.new('RGB', (100, 100), color='blue')
    
    # Sauvegarder en PNG
    img_path = 'test_image.png'
    img.save(img_path, 'PNG')
    
    return img_path

def test_photo_upload_with_token():
    # Créer une image de test
    image_path = create_test_image()
    
    # Token valide fourni par l'utilisateur
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYwNjI0NzYyLCJpYXQiOjE3NjA2MjI5NjIsImp0aSI6IjkyM2M5OTIyZDYxNzQ4NWFhYTgyNGVhMmJhOGI4NmNmIiwidXNlcl9pZCI6IjEifQ.GFb4-epmkf0a_EqP1DSUm7KaofuBL3R5BOBaa3FV7wI"
    
    try:
        # URL de l'API
        url = "http://127.0.0.1:8000/api/accounts/upload-photo/"
        
        # Préparer les données
        with open(image_path, 'rb') as f:
            files = {'photo': f}
            headers = {
                'Authorization': f'Bearer {token}'
            }
            
            # Faire la requête
            response = requests.post(url, files=files, headers=headers)
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                photo_url = result.get('photo_url')
                filename = result.get('filename')
                print(f"✅ Upload réussi !")
                print(f"Photo URL: {photo_url}")
                print(f"Filename: {filename}")
                
                # Tester l'accès à l'URL
                if photo_url:
                    print(f"\n🔍 Test d'accès à l'URL de la photo...")
                    media_response = requests.get(photo_url)
                    print(f"Media access status: {media_response.status_code}")
                    if media_response.status_code == 200:
                        print("✅ Fichier médias accessible !")
                        print(f"Content-Type: {media_response.headers.get('content-type')}")
                        print(f"Content-Length: {media_response.headers.get('content-length')}")
                    else:
                        print("❌ Fichier médias non accessible")
                        print(f"Response: {media_response.text[:200]}...")
            else:
                print(f"❌ Erreur d'upload: {response.status_code}")
                print(f"Response: {response.text}")
    
    except Exception as e:
        print(f"Erreur: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Nettoyer
        if os.path.exists(image_path):
            os.remove(image_path)

if __name__ == "__main__":
    test_photo_upload_with_token()
