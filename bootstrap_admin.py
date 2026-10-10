import os,getpass
os.environ.setdefault('DJANGO_SETTINGS_MODULE','campus.settings')
import django
django.setup()
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.db import transaction
from campus.models import Profile
if Profile.objects.filter(role='admin').exists():
    raise SystemExit('Ya existe una cuenta administrativa. Utiliza esa cuenta para gestionar el campus.')
email=input('Correo: ').strip().lower();validate_email(email)
name=input('Nombre completo: ').strip()
pw=getpass.getpass('Contraseña (mínimo 10 caracteres): ')
if len(pw)<10 or not name:raise SystemExit('Completa el nombre y usa una contraseña de al menos 10 caracteres.')
if pw!=getpass.getpass('Repite la contraseña: '):raise SystemExit('Las contraseñas no coinciden.')
parts=name.split(' ',1)
with transaction.atomic():
    u=User.objects.create_user(username=email,email=email,password=pw,first_name=parts[0],last_name=parts[1] if len(parts)>1 else '')
    Profile.objects.create(user=u,role='admin')
print('Cuenta administrativa creada.')
