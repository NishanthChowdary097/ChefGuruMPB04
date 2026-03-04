import os
from datetime import timedelta
from dotenv import load_dotenv
import warnings
import uuid

load_dotenv()

class EnvironmentWarning(UserWarning):
    """Warning for environment-related issues."""


warnings.simplefilter("always", EnvironmentWarning)


class Config:
    # ports
    AUTH_SERVER_PORT = os.getenv('AUTH_SERVER_PORT',5000)
    MAIN_SERVER_PORT = os.getenv('MAIN_SERVER_PORT',6000)
    SERVER_BASE_URL = os.getenv('SERVER_BASE_URL')
    FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL")
    
    SECRET_KEY = os.environ.get('SECRET_KEY')
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
    
    DEFAULT_ADMIN_PASSWORD = os.getenv('DEFAULT_ADMIN_PASSWORD', 'AdminDefault1!')

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(
        os.getenv('JWT_ACCESS_TOKEN_EXPIRES_SECONDS', 0)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=int(
        os.getenv('JWT_REFRESH_TOKEN_EXPIRES_SECONDS', 0)))
    JWT_REFRESH_TOKEN_EXPIRES_REMEMBER_ME = timedelta(seconds=int(
        os.getenv('JWT_REFRESH_TOKEN_EXPIRES_REMEMBER_ME_SECONDS', 0)))
    JWT_DECODE_LEEWAY = 15
    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_DOMAIN = None
    JWT_CSRF_IN_COOKIES = False
    JWT_COOKIE_SAMESITE = 'Lax'
    JWT_ACCESS_CSRF_HEADER_NAME = 'x-csrf-token'
    JWT_REFRESH_CSRF_HEADER_NAME = 'x-csrf-token'
    JWT_ALGORITHM = "HS256"

    if not all([SECRET_KEY, CORS_ALLOWED_ORIGINS, JWT_SECRET_KEY, JWT_ACCESS_TOKEN_EXPIRES, JWT_REFRESH_TOKEN_EXPIRES]):
        warnings.warn('Auth config missing')

    MONGO_PORT = os.getenv('MONGO_PORT', None)
    MONGO_HOST = os.getenv('MONGO_HOST', None)
    MONGO_DB = os.getenv('MONGO_DB', None)
    MONGO_USERNAME = os.getenv('MONGO_USERNAME', None)
    MONGO_PASSWORD = os.getenv('MONGO_PASSWORD', None)

    MONGO_URI= f"mongodb://{MONGO_USERNAME}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource=admin"

    REDIS_PORT = os.getenv('REDIS_PORT', None)
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
    REDIS_HOST = os.getenv('REDIS_HOST', None)
    REDIS_DB = os.getenv('REDIS_DB',0)
    REDIS_RATE_LIMIT_DB = os.getenv('REDIS_RATE_LIMIT_DB',1)
    
    CHAT_ERROR_SIGNAL = f"__ERROR_{uuid.uuid4()}__"
    CHAT_TERMINATION_SIGNAL = f"__TERMINATE_{uuid.uuid4()}__"

    MAIL_SERVER = os.getenv("MAIL_SERVER")
    MAIL_PORT = int(os.getenv("MAIL_PORT"))
    MAIL_USE_TLS=os.getenv("MAIL_USE_TLS").lower() == "true"
    MAIL_USE_SSL=os.getenv("MAIL_USE_SSL").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")


    LOGGING_LEVEL = int(os.getenv('SERVER_LOGGING_LEVEL', 10))
    LOG_MODE = 'development'
        
    API_PREFIX = "/api"

class DevelopmentConfig(Config):
    DEBUG = True
    USE_PROXY = False
    PROXY_FIX_X_FOR = 1

class ProductionConfig(Config):
    USE_PROXY = True
    PROXY_FIX_X_FOR = 1
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_DOMAIN = os.getenv('JWT_COOKIE_DOMAIN')
    JWT_COOKIE_SAMESITE = os.getenv('JWT_COOKIE_SAMESITE')
    LOG_MODE = 'production'

configurations = {
    'dev': DevelopmentConfig,
    'dep': ProductionConfig
}
