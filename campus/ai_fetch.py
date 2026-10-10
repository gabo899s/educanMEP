"""Public web sources only; DNS is pinned per connection and on every redirect."""
import http.client
import ipaddress
import re
import socket
import ssl
from html.parser import HTMLParser
from urllib.parse import urlsplit,urljoin,parse_qs

MAX_FETCH=8*1024*1024
class UnsafeSourceURL(ValueError): pass
class FetchUnavailable(ValueError): pass

def public_address(url):
    p=urlsplit(url)
    if p.scheme not in {'http','https'} or not p.hostname or p.username or p.password or p.port not in {None,80,443}:
        raise UnsafeSourceURL('Usa un enlace público HTTP/HTTPS sin credenciales ni puertos especiales.')
    host=p.hostname.encode('idna').decode()
    if host.lower() in {'localhost','metadata.google.internal'} or '%' in host: raise UnsafeSourceURL('El enlace debe ser público.')
    try: addresses={row[4][0] for row in socket.getaddrinfo(host,p.port or (443 if p.scheme=='https' else 80),type=socket.SOCK_STREAM)}
    except (socket.gaierror,UnicodeError): raise FetchUnavailable('No se encontró el sitio del enlace.')
    if not addresses or any(not ipaddress.ip_address(a).is_global for a in addresses): raise UnsafeSourceURL('No se permite acceder a redes privadas o direcciones internas.')
    return p,host,sorted(addresses)[0]

class PublicHTTPS(http.client.HTTPSConnection):
    def __init__(self,host,address,port):
        super().__init__(host,port=port,timeout=12,context=ssl.create_default_context());self.address=address
    def connect(self):
        sock=socket.create_connection((self.address,self.port),self.timeout)
        self.sock=self._context.wrap_socket(sock,server_hostname=self.host)

class PublicHTTP(http.client.HTTPConnection):
    def __init__(self,host,address,port): super().__init__(host,port=port,timeout=12);self.address=address
    def connect(self): self.sock=socket.create_connection((self.address,self.port),self.timeout)

def fetch_public(url):
    for _ in range(4):
        p,host,address=public_address(url)
        connection=(PublicHTTPS if p.scheme=='https' else PublicHTTP)(host,address,p.port or (443 if p.scheme=='https' else 80))
        try:
            path=p.path or '/'
            if p.query: path+='?'+p.query
            connection.request('GET',path,headers={'User-Agent':'LumaCampus/7 study-source','Accept':'text/html,text/plain,application/pdf','Accept-Encoding':'identity'})
            response=connection.getresponse()
            if response.status in {301,302,303,307,308}:
                location=response.getheader('Location')
                if not location: raise ValueError('El enlace redirige sin destino.')
                url=urljoin(url,location);continue
            if response.status!=200: raise FetchUnavailable('El sitio no permitió leer el contenido. Pega el texto que puedes consultar.')
            if response.getheader('Content-Encoding','identity').lower()!='identity': raise ValueError('El sitio devolvió un formato comprimido no compatible. Pega su contenido.')
            content=response.read(MAX_FETCH+1)
            if len(content)>MAX_FETCH: raise ValueError('El contenido del enlace supera 8 MB. Súbelo dividido.')
            return content,response.getheader('Content-Type',''),url
        except (OSError,http.client.HTTPException): raise FetchUnavailable('No se pudo leer el enlace. Comprueba su acceso público o pega el contenido.')
        finally: connection.close()
    raise ValueError('El enlace tiene demasiadas redirecciones.')

class WebText(HTMLParser):
    def __init__(self): super().__init__(convert_charrefs=True);self.parts=[];self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in {'script','style','noscript','svg'}: self.skip+=1
        elif tag in {'p','br','div','li','h1','h2','h3','tr','section','article'} and not self.skip: self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in {'script','style','noscript','svg'} and self.skip: self.skip-=1
    def handle_data(self,data):
        if not self.skip:self.parts.append(data)
    def text(self):return re.sub(r'[ \t]+',' ',''.join(self.parts)).strip()[:100000]

def web_extract(url):
    data,mime,final=fetch_public(url)
    if 'application/pdf' in mime.lower() or data.startswith(b'%PDF-'):
        from .ai_extract import extract_file
        _,content,notice=extract_file(data,'link.pdf');return content,notice
    if not any(kind in mime.lower() for kind in ['text/html','text/plain','application/xhtml+xml']): raise ValueError('El enlace debe contener una página, texto o un PDF.')
    charset=re.search(r'charset=([\w-]+)',mime,re.I)
    try: text=data.decode(charset.group(1) if charset else 'utf-8',errors='replace')
    except LookupError: text=data.decode('utf-8',errors='replace')
    if 'text/plain' in mime.lower():return text[:100000],''
    parser=WebText();parser.feed(text)
    return parser.text(),'La página puede omitir contenido que requiera iniciar sesión o JavaScript.'

def youtube_id(url):
    p=urlsplit(url);host=(p.hostname or '').lower()
    if p.scheme not in {'https','http'} or p.username or p.password or p.port not in {None,80,443}:raise ValueError('Usa un enlace de YouTube válido.')
    if host=='youtu.be': identifier=p.path.strip('/').split('/')[0]
    elif host in {'youtube.com','www.youtube.com','m.youtube.com'}:
        identifier=parse_qs(p.query).get('v',[''])[0] if p.path=='/watch' else p.path.split('/')[2] if p.path.startswith(('/shorts/','/embed/','/live/')) else ''
    else:raise ValueError('Usa un enlace de YouTube válido.')
    if not re.fullmatch(r'[A-Za-z0-9_-]{11}',identifier):raise ValueError('No se encontró un identificador de video válido.')
    return identifier

def youtube_extract(url):
    identifier=youtube_id(url)
    from youtube_transcript_api import YouTubeTranscriptApi
    import requests
    class TimedSession(requests.Session):
        def request(self,*args,**kwargs):kwargs.setdefault('timeout',12);return super().request(*args,**kwargs)
    with TimedSession() as client:
        try:
            transcripts=YouTubeTranscriptApi(http_client=client).list(identifier)
            try: transcript=transcripts.find_transcript(['es','en'])
            except Exception: transcript=next(iter(transcripts))
            fetched=transcript.fetch()
            text='\n'.join(f'[{int(s.start)//60:02d}:{int(s.start)%60:02d}] {s.text}' for s in fetched)
            return text[:100000],'Se utilizan los subtítulos disponibles; Luma AI no ve ni escucha el video.'
        except Exception:
            return '','No se pudieron obtener subtítulos públicos. Pega la transcripción para estudiar este video.'
