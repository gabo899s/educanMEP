"""Prepara una instalación real. Nunca crea cuentas o contenido de ejemplo."""
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','campus.settings')
import django
django.setup()
from django.contrib.auth.models import User
from django.db import transaction
with transaction.atomic():
    demo=User.objects.filter(email__iendswith='@luma.demo')
    count=demo.filter(is_active=True).count()
    demo.update(is_active=False)
    # Historical records remain intact; demo accounts cannot sign in or receive messages.
if count:print(f'{count} cuentas de demostración desactivadas. Sus registros históricos se conservan.')
if not User.objects.filter(is_active=True,profile__role='admin').exists():
    print('Crea tu primera cuenta real: python3 bootstrap_admin.py')
else:print('Campus preparado. Cuentas reales y datos existentes conservados.')
