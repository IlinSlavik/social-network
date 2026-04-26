import hashlib
import secrets

def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Генерация токена сессии"""
    return secrets.token_urlsafe(32)

def verify_password(password: str, hash_value: str) -> bool:
    """Проверка пароля"""
    return hash_password(password) == hash_value