#!/usr/bin/env python3
"""
Test d'upload avec une image existante
"""
import os
import requests

def test_photo_upload_with_existing_image():
    # Utiliser une image existante
    image_path = "media/photoUser/034d7715-c230-4175-bb30-710eace6c944.png"
    
    # Token valide fourni par l'utilisateur
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYwNjI0NzYyLCJpYXQiOjE3NjA2MjI5NjIsImp0aSI6IjkyM2M5OTIyZDYxNzQ4NWFhYTgyNGVhMmJhOGI4NmNmIiwidXNlcl9pZCI6IjEifQ.GFb4-epmkf0a_EqP1DSUm7KaofuBL3R5BOBaa3FV7wI"
    
    if not os.path.exists(image_path):
        print(f"❌ Image non trouvée: {image_path}")
        return
    
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

if __name__ == "__main__":
    test_photo_upload_with_existing_image()
