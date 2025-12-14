from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import (
    UserCreate,
    UserLogin,
    Token,
    UserResponse,
    GoogleAuthRequest,
    SocialAuthResponse,
)

# ✅ SỬA: Import class và các hàm đúng
from app.services.auth_service import AuthService
from app.utils.security import create_access_token, get_current_user  # ← Import từ utils.security
from app.services.google_auth import google_auth_service
from app.models.user import User, AuthProvider
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ✨ Google OAuth Login/Register
@router.post("/google", response_model=SocialAuthResponse)
async def google_auth(
    request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate with Google OAuth
    - If user exists: login
    - If new user: create account
    """
    try:
        # Verify Google token
        google_info = google_auth_service.verify_token(request.credential)
        
        if not google_info.get("email_verified"):
            raise HTTPException(
                status_code=400,
                detail="Email chưa được xác thực bởi Google"
            )
        
        # Check if user exists
        user = db.query(User).filter(User.email == google_info["email"]).first()
        is_new_user = False
        
        if not user:
            # Create new user
            user = User(
                email=google_info["email"],
                full_name=google_info["name"],
                avatar_url=google_info["picture"],
                auth_provider=AuthProvider.GOOGLE,
                google_id=google_info["sub"],
                hashed_password=None  # No password for OAuth users
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            is_new_user = True
        else:
            # Update existing user's info if needed
            if user.auth_provider == AuthProvider.EMAIL:
                # Link Google account to existing email account
                user.auth_provider = AuthProvider.GOOGLE
                user.google_id = google_info["sub"]
            
            # Update profile picture if changed
            if google_info["picture"] != user.avatar_url:
                user.avatar_url = google_info["picture"]
            
            db.commit()
            db.refresh(user)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user,
            "is_new_user": is_new_user
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")


# ✅ SỬA: Sử dụng AuthService.register_user()
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Traditional email/password registration"""
    return AuthService.register_user(db, user)

# ✅ SỬA: Sử dụng AuthService.authenticate_user()
@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """Traditional email/password login"""
    return AuthService.authenticate_user(db, user.email, user.password)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user