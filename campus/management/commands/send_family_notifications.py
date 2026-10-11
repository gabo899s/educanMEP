from django.core.management.base import BaseCommand
from campus.family_delivery import process
class Command(BaseCommand):
    help='Procesa comunicados y resúmenes por correo, SMS y Web Push. Ejecutar cada minuto con cron.'
    def add_arguments(self,parser):parser.add_argument('--limit',type=int,default=100)
    def handle(self,*args,**opts):
        limit=opts['limit']
        if not 1<=limit<=1000:raise ValueError('El límite debe estar entre 1 y 1000.')
        self.stdout.write(f'Envíos aceptados por proveedor: {process(limit)}')
