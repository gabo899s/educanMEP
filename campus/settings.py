import os
from pathlib import Path
BASE_DIR=Path(__file__).resolve().parent.parent
# Local secrets never enter the browser or packaged ZIP. Existing environment wins.
if (BASE_DIR/'.env').is_file():
    for line in (BASE_DIR/'.env').read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key,value=line.split('=',1)
            if key.strip() in {'NVIDIA_API_KEY','LUMA_NVIDIA_API_KEY','LUMA_NVIDIA_MODEL','LUMA_SECRET_KEY','LUMA_DEBUG','LUMA_ALLOWED_HOSTS'}:
                os.environ.setdefault(key.strip(),value.strip().strip('\"').strip("'"))
LUMA_NVIDIA_API_KEY=os.environ.get('LUMA_NVIDIA_API_KEY') or os.environ.get('NVIDIA_API_KEY','')
LUMA_NVIDIA_MODEL=os.environ.get('LUMA_NVIDIA_MODEL','moonshotai/kimi-k2-instruct')
SECRET_KEY=os.environ.get('LUMA_SECRET_KEY','local-development-only-change-before-production')
DEBUG=os.environ.get('LUMA_DEBUG','1')=='1'
if not DEBUG and not os.environ.get('LUMA_SECRET_KEY'):
    raise RuntimeError('Configura LUMA_SECRET_KEY antes de ejecutar en producción.')
ALLOWED_HOSTS=os.environ.get('LUMA_ALLOWED_HOSTS','localhost,127.0.0.1,testserver').split(',')
INSTALLED_APPS=['django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','campus']
MIDDLEWARE=['django.middleware.security.SecurityMiddleware','django.middleware.gzip.GZipMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.middleware.clickjacking.XFrameOptionsMiddleware']
ROOT_URLCONF='campus.urls'
DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':BASE_DIR/'campus.sqlite3'}}
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
TIME_ZONE='America/Costa_Rica'
USE_TZ=True
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE='Lax'
SESSION_COOKIE_SECURE=not DEBUG
CSRF_COOKIE_SECURE=not DEBUG
DATA_UPLOAD_MAX_MEMORY_SIZE=8*1024*1024
MEDIA_ROOT=BASE_DIR/'uploads'

# Notification secrets live on the server. Optional channels stay disabled until configured.
FAMILY_ENV_KEYS={'LUMA_SMTP_HOST','LUMA_SMTP_PORT','LUMA_SMTP_USER','LUMA_SMTP_PASSWORD','LUMA_SMTP_TLS','LUMA_SMTP_SSL',
 'LUMA_EMAIL_FROM','LUMA_TWILIO_ACCOUNT','LUMA_TWILIO_TOKEN','LUMA_TWILIO_FROM','LUMA_VAPID_PRIVATE_KEY','LUMA_VAPID_PUBLIC_KEY',
 'LUMA_VAPID_SUBJECT','LUMA_PUBLIC_URL'}
if (BASE_DIR/'.env').is_file():
    for line in (BASE_DIR/'.env').read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key,value=line.split('=',1)
            if key.strip() in FAMILY_ENV_KEYS:os.environ.setdefault(key.strip(),value.strip().strip('\"').strip("'"))
for key in FAMILY_ENV_KEYS:globals()[key]=os.environ.get(key,'')
LUMA_SMTP_PORT=int(os.environ.get('LUMA_SMTP_PORT','587'))
LUMA_SMTP_TLS=os.environ.get('LUMA_SMTP_TLS','1')=='1'
LUMA_SMTP_SSL=os.environ.get('LUMA_SMTP_SSL','0')=='1'
LUMA_EMAIL_FROM=os.environ.get('LUMA_EMAIL_FROM',LUMA_SMTP_USER)
LUMA_VAPID_SUBJECT=os.environ.get('LUMA_VAPID_SUBJECT','mailto:admin@example.com')
