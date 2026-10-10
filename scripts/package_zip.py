"""Genera un ZIP completo del campus sin datos locales ni archivos de Git."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'downloads'/'LumaCampus.zip'
EXCLUDED={'.git','.venv','__pycache__','uploads','downloads'}

def main():
    OUT.parent.mkdir(exist_ok=True)
    with ZipFile(OUT,'w',compression=ZIP_DEFLATED,compresslevel=6) as archive:
        for path in sorted(ROOT.rglob('*')):
            relative=path.relative_to(ROOT)
            if not path.is_file() or any(part in EXCLUDED for part in relative.parts):
                continue
            if path.name=='.env' or path.suffix in {'.sqlite3','.pyc','.zip'}:
                continue
            archive.write(path,str(Path('LumaCampus')/relative))
        if archive.testzip() is not None:
            raise RuntimeError('La comprobación de integridad del ZIP falló.')
    digest=hashlib.sha256(OUT.read_bytes()).hexdigest()
    (OUT.parent/'SHA256SUMS.txt').write_text(digest+'  LumaCampus.zip\n',encoding='utf-8')
    print(f'ZIP creado: downloads/LumaCampus.zip ({OUT.stat().st_size:,} bytes)')

if __name__=='__main__':
    main()
