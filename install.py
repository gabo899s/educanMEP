"""Instalación local reproducible, sin descargas: usa las ruedas incluidas."""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV = ROOT / '.venv'
PYTHON = VENV / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')

def command(args):
    subprocess.run([str(x) for x in args], cwd=ROOT, check=True)

def install():
    if sys.version_info < (3, 10):
        raise RuntimeError('Necesitas Python 3.10 o superior. Se recomienda Python 3.12.')
    if not PYTHON.exists():
        print('1/4 Creando entorno virtual...', flush=True)
        import venv
        venv.EnvBuilder(with_pip=True).create(VENV)
    print('2/4 Instalando dependencias incluidas en el ZIP...', flush=True)
    command([PYTHON, '-m', 'pip', 'install', '--disable-pip-version-check', '--no-index', '--find-links', ROOT/'vendor'/'wheels', '-r', ROOT/'requirements.txt'])
    print('3/4 Verificando y preparando la base de datos...', flush=True)
    command([PYTHON, 'manage.py', 'check'])
    command([PYTHON, 'manage.py', 'migrate', '--noinput'])
    print('4/4 Preparando el campus para cuentas reales...', flush=True)
    command([PYTHON, 'seed.py'])
    print('\nInstalación completa. Ejecuta: ' + ('py -3' if os.name == 'nt' else 'python3') + ' run.py', flush=True)

if __name__ == '__main__':
    try:
        install()
    except (RuntimeError, OSError, subprocess.CalledProcessError) as error:
        print(f'\nNo se completó la instalación: {error}', file=sys.stderr)
        print('Consulta INSTALACION.md. En Linux, comprueba que python3-venv esté instalado.', file=sys.stderr)
        sys.exit(1)
