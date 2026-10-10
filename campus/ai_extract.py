"""Bounded text extraction; isolated worker for untrusted PDFs and OCR images."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

MAX_TEXT=100000
ALLOWED_EXTENSIONS={'.pdf','.png','.jpg','.jpeg','.txt','.md'}

def file_kind(data,name):
    ext=Path(name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS: raise ValueError('Usa PDF, PNG, JPG, TXT o Markdown.')
    if ext=='.pdf' and not data.startswith(b'%PDF-'): raise ValueError('El archivo no contiene un PDF válido.')
    if ext=='.png' and not data.startswith(b'\x89PNG\r\n\x1a\n'): raise ValueError('La imagen no contiene un PNG válido.')
    if ext in {'.jpg','.jpeg'} and not data.startswith(b'\xff\xd8\xff'): raise ValueError('La imagen no contiene un JPG válido.')
    if ext in {'.txt','.md'}:
        try:
            if b'\x00' in data: raise ValueError('El archivo debe contener texto UTF-8.')
            data.decode('utf-8-sig')
        except UnicodeError: raise ValueError('El archivo debe contener texto UTF-8.')
    return 'pdf' if ext=='.pdf' else 'image' if ext in {'.png','.jpg','.jpeg'} else 'file'

def ocr(path):
    if not shutil.which('tesseract'): return ''
    langs=subprocess.run(['tesseract','--list-langs'],capture_output=True,text=True,timeout=5).stdout.splitlines()
    lang='spa+eng' if 'spa' in langs and 'eng' in langs else 'spa' if 'spa' in langs else 'eng'
    with tempfile.TemporaryDirectory(prefix='luma-ocr-') as folder:
        out=Path(folder)/'text'
        result=subprocess.run(['tesseract',str(path),str(out),'-l',lang],capture_output=True,timeout=20)
        output=out.with_suffix('.txt')
        if result.returncode or not output.exists() or output.stat().st_size>500000: return ''
        return output.read_text(errors='replace')[:MAX_TEXT].strip()

def worker(path):
    path=Path(path)
    kind=file_kind(path.read_bytes(),path.name)
    notice=''
    if kind=='file': content=path.read_text(encoding='utf-8-sig')
    elif kind=='image':
        content=ocr(path)
        notice='Texto extraído por OCR; revisa nombres, fórmulas y cifras.' if content else 'No se pudo leer texto de la imagen. Añade su transcripción; Kimi K2 no ve imágenes.'
    else:
        from pypdf import PdfReader
        reader=PdfReader(path)
        if reader.is_encrypted: raise ValueError('El PDF está protegido. Sube una copia sin contraseña.')
        if len(reader.pages)>80: raise ValueError('Divide el PDF en documentos de hasta 80 páginas.')
        sections=[];scans=0;unread=0
        for number,page in enumerate(reader.pages,1):
            text=(page.extract_text() or '').strip()
            if not text and scans<8 and shutil.which('pdftoppm') and shutil.which('tesseract'):
                scans+=1
                with tempfile.TemporaryDirectory(prefix='luma-page-') as folder:
                    prefix=Path(folder)/'page'
                    subprocess.run(['pdftoppm','-f',str(number),'-l',str(number),'-singlefile','-scale-to','1600','-png',str(path),str(prefix)],capture_output=True,timeout=15,check=True)
                    text=ocr(prefix.with_suffix('.png'))
            if text: sections.append(f'[Página {number}]\n{text}')
            else: unread+=1
            if sum(map(len,sections))>=MAX_TEXT: break
        content='\n\n'.join(sections)
        if unread: notice=f'{unread} páginas sin texto legible. El OCR procesa hasta 8 páginas escaneadas; añade texto para las restantes.'
        elif scans: notice='Incluye texto leído por OCR. Revisa fórmulas, nombres y cifras.'
        if not content: notice='Este PDF no aportó texto legible. Instala OCR o añade una transcripción.'
    if len(content)>MAX_TEXT: notice=(notice+' Se conservan los primeros 100.000 caracteres; divide el material para estudiar el resto.').strip()
    return {'content':content[:MAX_TEXT].strip(),'notice':notice}

def extract_file(data,name):
    kind=file_kind(data,name)
    with tempfile.TemporaryDirectory(prefix='luma-source-') as folder:
        path=Path(folder)/('source'+Path(name).suffix.lower());path.write_bytes(data)
        try:
            proc=subprocess.run([sys.executable,'-m','campus.ai_extract',str(path)],cwd=Path(__file__).resolve().parent.parent,capture_output=True,timeout=50,env={**os.environ,'OMP_THREAD_LIMIT':'1'})
            result=json.loads(proc.stdout)
            if proc.returncode or result.get('error'): raise ValueError(result.get('error','El archivo no se pudo procesar.'))
            return kind,result['content'],result['notice']
        except (subprocess.TimeoutExpired,json.JSONDecodeError):
            return kind,'','El procesamiento excedió el límite. Divide el archivo o añade una transcripción.'

if __name__=='__main__':
    try:
        if os.name=='posix':
            import resource
            resource.setrlimit(resource.RLIMIT_AS,(1024**3,1024**3))
            resource.setrlimit(resource.RLIMIT_CPU,(45,45))
            resource.setrlimit(resource.RLIMIT_FSIZE,(24*1024**2,24*1024**2))
        print(json.dumps(worker(sys.argv[1]),ensure_ascii=False))
    except Exception as e:
        message=str(e) if isinstance(e,ValueError) else 'No se pudo leer el documento. Comprueba el formato o pega su contenido.'
        print(json.dumps({'error':message[:300]},ensure_ascii=False));sys.exit(1)
