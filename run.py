"""Arranque compatible con Windows, macOS y Linux."""
import argparse
import os
import socket
import subprocess
import sys
from install import ROOT, PYTHON, install, command

def main():
    parser=argparse.ArgumentParser(description='Inicia Luma Campus en tu equipo.')
    parser.add_argument('--port', type=int, default=8000, help='Puerto local (por defecto: 8000).')
    args=parser.parse_args()
    if not 1 <= args.port <= 65535:
        raise RuntimeError('El puerto debe estar entre 1 y 65535.')
    if not PYTHON.exists():
        install()
    else:
        probe_code = "from importlib.metadata import version; from pathlib import Path; requirements=[line.strip().split('==') for line in Path('requirements.txt').read_text().splitlines() if line.strip() and not line.startswith('#')]; assert all(version(name)==expected for name,expected in requirements)"
        probe=subprocess.run([str(PYTHON), '-c', probe_code],cwd=ROOT,capture_output=True)
        if probe.returncode:
            install()
        else:
            command([PYTHON, 'manage.py', 'check'])
            command([PYTHON, 'manage.py', 'migrate', '--noinput'])
            command([PYTHON, 'seed.py'])
    account_probe=subprocess.run([str(PYTHON), 'manage.py', 'shell', '-c', "from django.contrib.auth.models import User; import sys; sys.exit(0 if User.objects.filter(is_active=True,profile__role='admin').exclude(email__iendswith='@luma.demo').exists() else 1)"],cwd=ROOT,capture_output=True)
    if account_probe.returncode:
        print('Configura tu primera cuenta administrativa real. No se crean cuentas de prueba.',flush=True)
        command([PYTHON,'bootstrap_admin.py'])
    launcher = 'py -3' if os.name == 'nt' else 'python3'
    with socket.socket(socket.AF_INET,socket.SOCK_STREAM) as sock:
        try:
            sock.bind(('127.0.0.1',args.port))
        except OSError:
            raise RuntimeError(f'El puerto {args.port} está ocupado. Prueba: {launcher} run.py --port {args.port+1 if args.port<65535 else 8000}')
    print(f'\nLuma Campus listo: http://127.0.0.1:{args.port}\nDeja esta ventana abierta. Para detener: Ctrl+C.\n',flush=True)
    os.execv(str(PYTHON),[str(PYTHON),str(ROOT/'manage.py'),'runserver',f'127.0.0.1:{args.port}','--noreload'])

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        pass
    except (RuntimeError, OSError, subprocess.CalledProcessError) as error:
        print(f'\nNo se pudo iniciar: {error}',file=sys.stderr)
        sys.exit(1)
