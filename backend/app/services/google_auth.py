# ============================================================
# backend/app/services/google_auth.py
# ============================================================
from google.oauth2 import id_token
from google.auth.transport import requests
import os
from typing import Dict, Optional

class GoogleAuthService:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        
    def verify_token(self, credential: str) -> Dict:
        """
        Verify Google OAuth token and return user info
        Returns: {
            "email": str,
            "name": str,
            "picture": str,
            "sub": str  # Google user ID
        }
        """
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                credential, 
                requests.Request(), 
                self.client_id
            )
            
            # Token is valid
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
                
            return {
                "email": idinfo['email'],
                "name": idinfo.get('name', ''),
                "picture": idinfo.get('picture', ''),
                "sub": idinfo['sub'],  # Google user ID
                "email_verified": idinfo.get('email_verified', False)
            }
            
        except ValueError as e:
            raise ValueError(f"Invalid token: {str(e)}")

google_auth_service = GoogleAuthService()