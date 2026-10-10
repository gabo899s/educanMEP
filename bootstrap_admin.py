"""Crea la primera cuenta real usando el entorno instalado de Luma Campus."""
import os
import sys
import getpass
from install import ROOT, PYTHON

def main():
    if not PYTHON.exists():
        raise ValueError('Instala primero con python3 install.py (Windows: py -3 install.py).')
    if os.path.abspath(sys.executable)!=os.path.abspath(str(PYTHON)):
        os.execv(str(PYTHON),[str(PYTHON),str(ROOT/'bootstrap_admin.py')])
    os.environ.setdefault('DJANGO_SETTINGS_MODULE','campus.settings')
    import django
    django.setup()
    from django.contrib.auth.models import User
    from django.core.validators import validate_email
    from django.db import transaction
    from campus.models import Profile
    if Profile.objects.filter(role='admin',user__is_active=True).exclude(user__email__iendswith='@luma.demo').exists():
        print('Ya existe una cuenta administrativa real. Utiliza esa cuenta para gestionar el campus.')
        return
    email=input('Correo real de administración: ').strip().lower()
    validate_email(email)
    if len(email)>150:raise ValueError('Usa un correo de hasta 150 caracteres.')
    if email.endswith('@luma.demo'):raise ValueError('Usa el correo real de tu institución, no el dominio de demostración.')
    if User.objects.filter(email__iexact=email).exists():raise ValueError('Ese correo ya está registrado; utiliza otro correo administrativo.')
    name=input('Nombre completo: ').strip()
    if not name or len(name)>100:raise ValueError('Escribe tu nombre completo, de hasta 100 caracteres.')
    pw=getpass.getpass('Contraseña (entre 10 y 100 caracteres): ')
    if not 10<=len(pw)<=100:raise ValueError('Usa una contraseña de entre 10 y 100 caracteres.')
    if pw!=getpass.getpass('Repite la contraseña: '):raise ValueError('Las contraseñas no coinciden.')
    parts=name.split(' ',1)
    with transaction.atomic():
        u=User.objects.create_user(username=email,email=email,password=pw,first_name=parts[0],last_name=parts[1] if len(parts)>1 else '')
        Profile.objects.create(user=u,role='admin')
        User.objects.filter(email__iendswith='@luma.demo').update(is_active=False)
    print('Cuenta administrativa creada. Inicia sesión con tu correo y contraseña.')

if __name__=='__main__':
    try:
        main()
    except (KeyboardInterrupt,EOFError):
        print('\nConfiguración interrumpida. Ejecuta de nuevo bootstrap_admin.py para continuar.')
        sys.exit(1)
    except Exception as error:
        message=' '.join(error.messages) if hasattr(error,'messages') else str(error)
        print('No se pudo crear la cuenta: '+message,file=sys.stderr)
        sys.exit(1)
