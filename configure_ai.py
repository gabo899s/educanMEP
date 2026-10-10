"""Store a NVIDIA key locally without exposing it in terminal history."""
from getpass import getpass
from pathlib import Path
import os
import re

def main():
    root=Path(__file__).resolve().parent
    print('Luma AI · configuración privada del servidor')
    print('Crea tu clave en https://build.nvidia.com/moonshotai/kimi-k2-instruct')
    key=getpass('Clave de API de NVIDIA (no se muestra): ').strip()
    if len(key)<20 or not re.fullmatch(r'[A-Za-z0-9_-]+',key):
        raise ValueError('La clave no tiene un formato válido. No se guardó ningún cambio.')
    path=root/'.env'
    previous=path.read_text(encoding='utf-8').splitlines() if path.exists() else []
    lines=[line for line in previous if line.split('=',1)[0].strip() not in {'NVIDIA_API_KEY','LUMA_NVIDIA_API_KEY'}]
    lines.append('NVIDIA_API_KEY='+key)
    if not any(line.startswith('LUMA_NVIDIA_MODEL=') for line in lines):lines.append('LUMA_NVIDIA_MODEL=moonshotai/kimi-k2-instruct')
    path.write_text('\n'.join(lines)+'\n',encoding='utf-8')
    if os.name=='posix':path.chmod(0o600)
    print('Clave guardada en .env. Reinicia python3 run.py para activar el chat.')
    print('La configuración no se incluye en Git ni en el ZIP.')

if __name__=='__main__':
    try:main()
    except (ValueError,EOFError,KeyboardInterrupt) as error:print(str(error) or 'Configuración cancelada.')
