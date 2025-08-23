from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(subject: str | int):
    now = datetime.now(timezone.utc) 
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": str(subject), 
        "exp": expire,
         "iat": now,   # eklendi
        "nbf": now    # eklendi
        }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
