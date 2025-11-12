

from pathlib import Path
import os
from datetime import timedelta








# (optionnel mais pratique pour .env)
try:
    from dotenv import load_dotenv
    load_dotenv()
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
except Exception:
    pass


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# --- Sécurité / Debug ---
SECRET_KEY = os.getenv("SECRET_KEY", "")
# DEBUG sera défini plus bas après la configuration de base
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")
# ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "127.0.0.1,localhost,7658ab23c8a9.ngrok-free.app").split(",")

# SECURITY WARNING: keep the secret key used in production secret!
#SECRET_KEY = 'django-insecure-p)z2579b)&7#o)g1#@$8f8p@lsp!$lr&qp6q%h6ig=q0=ht-b_'

# SECURITY WARNING: don't run with debug turned on in production!
# DEBUG = True  # Commenté pour utiliser la valeur du .env

# ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '0.0.0.0', 'testserver']  # Commenté pour utiliser la valeur du .env


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    
    # Mes applications
    'accounts',
    'rest_framework',
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    'projects',
    'documents',
    'chatbot',
    'notifications',
    'analytics',
    
    # Django Channels
    'channels',
]


#Ajout de la config ci 
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}


MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # CORS en premier
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]




ROOT_URLCONF = 'gestion.urls'


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]




LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
}



WSGI_APPLICATION = 'gestion.wsgi.application'
ASGI_APPLICATION = 'gestion.asgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# --- Base de données: MySQL ---
# Nécessite le paquet 'mysqlclient'
# pip install mysqlclient
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME", "gestion_bd"),
        "USER": os.getenv("DB_USER", "root"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "3306"),
        "OPTIONS": {
            "charset": "utf8mb4",
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

# --- Utilisateur on n'utilise plus le user par defaut de django ---

AUTH_USER_MODEL = "accounts.User"


# --- DRF & JWT ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

# Configuration des tokens de réinitialisation de mot de passe
PASSWORD_RESET_TIMEOUT = 86400  # 24 heures en secondes

# Configuration JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),  # Réduit pour plus de sécurité
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # Augmenté pour meilleure UX
    'ROTATE_REFRESH_TOKENS': True,                   # Activé pour plus de sécurité
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,                       # Activé pour le suivi

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

    'JTI_CLAIM': 'jti',

    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# Gestion intelligente des ALLOWED_HOSTS
if DEBUG:
    ALLOWED_HOSTS = ['127.0.0.1', 'localhost', '0.0.0.0']
else:
    # En production, on utilise la variable d'environnement
    allowed_hosts_str = os.getenv('ALLOWED_HOSTS', '')
    ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_str.split(',') if host.strip()]

# --- CORS Configuration ---
# Configuration CORS après la définition finale de DEBUG
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True  # Pour le développement
    CORS_ALLOW_CREDENTIALS = True
else:
    # En production, utilise des origines spécifiques
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://ton-domaine.com"  # Remplacer par votre domaine de production
    ]
    CORS_ALLOW_CREDENTIALS = True

# Méthodes HTTP autorisées
CORS_ALLOWED_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# En-têtes autorisés
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# En prod: mets plutôt CORS_ALLOWED_ORIGINS = ["https://ton-domaine"]


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/


#TIME_ZONE = 'UTC'
# --- Internationalisation ---
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Africa/Libreville"
USE_I18N = True
USE_TZ = True



# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# --- Configuration Email ---
# Configuration Email SMTP (identique en développement et production)
# Utilisation d'un mot de passe d'application Google (16 caractères)

# OPTION 1: Backend SMTP réel (pour production)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

# OPTION 2: Backend console (pour développement/test si SMTP ne fonctionne pas)
# Décommentez la ligne suivante et commentez la ligne EMAIL_BACKEND ci-dessus si besoin
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Configuration SMTP pour Gmail
# Port 587 avec TLS (STARTTLS) - Plus fiable que le port 465
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True   # Utiliser STARTTLS sur le port 587
EMAIL_USE_SSL = False  # Ne pas utiliser SSL direct

# Récupérer les identifiants depuis les variables d'environnement ou utiliser les valeurs par défaut
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'marketges174@gmail.com')
# Le mot de passe d'application Google (16 caractères sans espaces)
# Format Google: "xxxx xxxx xxxx xxxx" -> convertir en "xxxxxxxxxxxxxxxx"
email_password_raw = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_HOST_PASSWORD = email_password_raw.replace(' ', '').replace('-', '') if email_password_raw else ''
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'marketges174@gmail.com')

# Timeout pour la connexion SMTP (en secondes) - augmenté pour les connexions lentes
EMAIL_TIMEOUT = 30

# URL du frontend pour les liens dans les emails
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Site ID pour django.contrib.sites
SITE_ID = 1

# Configuration Django Channels
# Configuration pour le développement (sans Redis)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    }
}

# Configuration alternative pour la production (avec Redis)
# CHANNEL_LAYERS = {
#     'default': {
#         'BACKEND': 'channels_redis.core.RedisChannelLayer',
#         'CONFIG': {
#             "hosts": [('127.0.0.1', 6379)],
#         },
#     },
# }

# Configuration des fichiers médias
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')




