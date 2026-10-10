"""Student-only study notebooks. Provider calls never hold a database transaction."""
import json
import re
import uuid
from datetime import timedelta
from pathlib import Path
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Count,Q
from django.http import JsonResponse,HttpResponse
from django.utils import timezone
from .models import AIStudySession,AIStudySource,AIStudyTurn,Course,Resource,Task,StudentNote
from .ai_extract import extract_file,MAX_TEXT
from .ai_fetch import web_extract,youtube_extract,FetchUnavailable
from .ai_provider import respond,assignment_signal,normalized,ProviderError

class AIError(Exception):
    def __init__(self,message,status=400):self.status=status;super().__init__(message)

def private_json(value,status=200):
    response=JsonResponse(value,status=status);response['Cache-Control']='private, no-store';return response

def own_session(u,identifier):
    from .views import integer
    s=AIStudySession.objects.get(id=integer(identifier,1,2**63-1))
    if s.student_id!=u.id:raise PermissionError('Esta sesión de estudio es privada.')
    return s

def own_source(u,identifier):
    from .views import integer
    s=AIStudySource.objects.select_related('session').get(id=integer(identifier,1,2**63-1))
    if s.session.student_id!=u.id:raise PermissionError('Esta fuente de estudio es privada.')
    return s

def check_idle(s):
    if s.busy_until and s.busy_until>timezone.now():raise AIError('Esta sesión está procesando una pregunta. Espera a que termine.',409)

def source_data(s,full=False):
    d={'id':s.id,'title':s.title,'kind':s.kind,'url':s.url,'file':s.original_name,'status':s.status,'notice':s.notice,'assignment':s.assignment,'characters':len(s.content),'preview':s.content[:240],'origin':s.origin}
    if full:d['content']=s.content
    return d

def state(u,identifier=None):
    studies=AIStudySession.objects.filter(student=u).select_related('course').annotate(source_count=Count('sources',distinct=True),turn_count=Count('turns',distinct=True)).order_by('-updated','-id')
    result={'configured':bool(settings.LUMA_NVIDIA_API_KEY),'model':settings.LUMA_NVIDIA_MODEL,'sessions':[{'id':s.id,'title':s.title,'course':s.course_id,'course_title':s.course.title if s.course else '', 'tutor_mode':s.tutor_mode,'source_count':s.source_count,'turn_count':s.turn_count,'updated':s.updated.isoformat()} for s in studies]}
    if identifier:
        s=own_session(u,identifier)
        busy=bool(s.busy_until and s.busy_until>timezone.now())
        turns=list(s.turns.order_by('created','id').values('id','request_id','question','answer','sources','citations','mode','status','error','created'))
        for turn in turns:
            if turn['status']=='pending' and not busy:
                turn['status']='failed';turn['error']='La conexión anterior se interrumpió. Puedes reintentar.'
        result['session']={'id':s.id,'title':s.title,'course':s.course_id,'tutor_mode':s.tutor_mode,'busy':busy,'sources':[source_data(x) for x in s.sources.order_by('id')],'turns':turns}
    else:result['session']=None
    return result

def purge_file(source):
    if source.file:
        storage,name=source.file.storage,source.file.name
        transaction.on_commit(lambda:storage.delete(name))

def incoming_file(request):
    if len(request.FILES)>1:raise ValueError('Sube un archivo cada vez.')
    f=request.FILES.get('file')
    if f:
        if not f.size or f.size>8*1024*1024:raise ValueError('El archivo debe contener datos y medir hasta 8 MB.')
        return f.read(),Path(f.name.replace('\\','/')).name[:255]
    return None,''

def add_source(request,u,d):
    from .views import text,getcourse,integer
    s=own_session(u,d.get('session'));check_idle(s)
    if s.sources.count()>=30:raise AIError('Esta sesión admite hasta 30 fuentes. Crea otra sesión o retira una fuente.')
    kind=d.get('kind');title=text(d,'title',180);content=text(d,'content',MAX_TEXT,False);url=text(d,'url',1000,False)
    notice='';origin={};assignment=False;filedata,name=incoming_file(request)
    if kind not in {'text','file','link','youtube','classroom','note'}:raise ValueError('Elige un tipo de fuente válido.')
    if kind!='file' and filedata:raise ValueError('Adjunta el archivo en la opción Archivo.')
    if kind=='text':
        if not content:raise ValueError('Pega el contenido que quieres estudiar.')
        url=''
    elif kind=='file':
        if filedata is None:raise ValueError('Selecciona un archivo.')
        kind,extracted,notice=extract_file(filedata,name)
        content=(extracted+'\n\n'+content).strip()[:MAX_TEXT];url=''
    elif kind in {'link','youtube'}:
        if not url:raise ValueError('Añade el enlace.')
        try:extracted,notice=(youtube_extract if kind=='youtube' else web_extract)(url)
        except FetchUnavailable:
            extracted='';notice='El sitio no se pudo leer. Se conserva el enlace; pega su contenido para estudiarlo.'
        content=(extracted+'\n\n'+content).strip()[:MAX_TEXT]
    elif kind=='note':
        n=StudentNote.objects.get(id=integer(d.get('note'),1,2**63-1),student=u)
        content=n.body[:MAX_TEXT];origin={'note':n.id,'title':n.title};url=''
    else:
        target=d.get('classroom_type')
        if target not in {'resource','task'}:raise ValueError('Elige un material o una actividad de Classroom.')
        obj=(Resource if target=='resource' else Task).objects.select_related('course').get(id=integer(d.get('classroom_id'),1,2**63-1))
        getcourse(u,obj.course_id)
        if target=='resource':
            from .administration import check_module
            check_module('resource')
        origin={'classroom_type':target,'classroom_id':obj.id,'course':obj.course_id,'title':obj.title}
        if target=='task':
            content=obj.description+'\n\n'+json.dumps({'campos':obj.fields,'rubrica':obj.rubric},ensure_ascii=False);assignment=True;url=''
        else:
            content=obj.body;url=obj.url
            if obj.file:
                if obj.file.size>8*1024*1024:raise ValueError('El material supera el límite de 8 MB.')
                with obj.file.open('rb') as f:filedata=f.read()
                name=obj.original_name or Path(obj.file.name).name
                try:
                    _,extracted,notice=extract_file(filedata,name);content=(content+'\n\n'+extracted).strip()
                except ValueError:notice='Este formato se conserva como archivo. Añade una transcripción para estudiarlo.'
            if url:
                try:
                    from .ai_fetch import youtube_id
                    try:youtube_id(url);youtube=True
                    except ValueError:youtube=False
                    extracted,link_notice=(youtube_extract if youtube else web_extract)(url)
                    content=(content+'\n\n'+extracted).strip();notice=(notice+' '+link_notice).strip()[:500]
                except ValueError:notice=(notice+' El enlace no se pudo leer; pega el contenido.').strip()[:500]
    assignment=assignment or assignment_signal(title+"\n"+name+"\n"+content)
    with transaction.atomic():
        s=own_session(u,s.id);check_idle(s)
        if s.sources.count()>=30:raise AIError('Esta sesión ya contiene 30 fuentes.')
        source=AIStudySource(session=s,kind=kind,title=title,content=content[:MAX_TEXT],url=url,status='ready' if content.strip() else 'needs_text',notice=notice[:500],assignment=assignment,origin=origin)
        if filedata is not None:
            source.file.save(name,ContentFile(filedata),save=False);source.original_name=name
        source.save()
        if assignment:s.tutor_mode=True
        s.save(update_fields=['tutor_mode','updated'])
    return state(u,s.id)

def context_for(s,ids,question):
    sources=list(s.sources.filter(id__in=ids).order_by('id'))
    if len(sources)!=len(ids):raise ValueError('Las fuentes seleccionadas deben pertenecer a esta sesión.')
    if any(src.status!='ready' for src in sources):raise ValueError('Añade texto a las fuentes pendientes antes de usarlas en el chat.')
    words=set(re.findall(r'\w{3,}',normalized(question)))
    entries=[]
    for source in sources:
        chunks=[source.content[i:i+2200] for i in range(0,len(source.content),1800)]
        ranked=sorted(enumerate(chunks),key=lambda x:len(words & set(re.findall(r'\w{3,}',normalized(x[1])))),reverse=True)
        for index,chunk in ranked[:3]:
            page=re.findall(r'\[Página (\d+)\]',chunk)
            entries.append({'source':source.id,'title':source.title,'location':'Página '+page[0] if page else 'Fragmento '+str(index+1),'text':chunk,'score':len(words & set(re.findall(r'\w{3,}',normalized(chunk))))})
    # One fragment per selected source first; then the strongest remaining passages.
    chosen=[];seen=set()
    for entry in entries:
        if entry['source'] not in seen:chosen.append(entry);seen.add(entry['source'])
    chosen+=sorted([e for e in entries if e not in chosen],key=lambda e:e['score'],reverse=True)
    context=[];length=0
    for entry in chosen[:12]:
        if length+len(entry['text'])>22000:break
        length+=len(entry['text']);context.append({k:v for k,v in entry.items() if k!='score'})
        context[-1]['label']='F'+str(len(context))
    return context

def chat(u,d):
    from .views import text,integer
    s=own_session(u,d.get('session'));question=text(d,'question',4000)
    try:request_id=uuid.UUID(str(d.get('request_id')))
    except (ValueError,AttributeError):raise ValueError('La pregunta necesita un identificador válido.')
    ids=d.get('sources',[])
    if not isinstance(ids,list) or len(ids)>10:raise ValueError('Selecciona hasta 10 fuentes por pregunta.')
    ids=[integer(v,1,2**63-1) for v in ids]
    if len(set(ids))!=len(ids):raise ValueError('Las fuentes no se pueden repetir.')
    existing=s.turns.filter(request_id=request_id).first()
    if existing:
        if existing.question!=question or existing.sources!=ids:raise AIError('Ese identificador pertenece a otra pregunta.',409)
        if existing.status=='complete':return state(u,s.id)
        if existing.status=='pending' and s.busy_until and s.busy_until>timezone.now():raise AIError('La pregunta todavía se está procesando.',409)
    if not settings.LUMA_NVIDIA_API_KEY:raise AIError('Luma AI aún necesita la clave de NVIDIA. Configúrala en el servidor con configure_ai.py; tus sesiones y fuentes ya se pueden guardar.',503)
    if s.turns.count()>=100 and not existing:raise AIError('Esta sesión contiene 100 preguntas. Crea otra sesión para seguir estudiando.')
    if AIStudyTurn.objects.filter(session__student=u,created__gte=timezone.now()-timedelta(minutes=10)).count()>=20 and not existing:raise AIError('Has enviado 20 preguntas en diez minutos. Espera unos minutos antes de continuar.',429)
    context=context_for(s,ids,question)
    # Real classroom assignments constrain the session even when not selected as sources.
    tasks=Task.objects.filter(course=s.course,course__students=u,course__archived=False) if s.course_id else Task.objects.none()
    match=any(len(normalized(t.title))>=12 and normalized(t.title) in normalized(question) for t in tasks)
    forced=s.tutor_mode or match or any(src.assignment for src in s.sources.all())
    if assignment_signal(question) or match:
        AIStudySession.objects.filter(id=s.id).update(tutor_mode=True);forced=True
    history=list(s.turns.filter(status='complete').order_by('-created').values('question','answer')[:6])[::-1]
    history=[{'question':t['question'][:2000],'answer':t['answer'][:3000]} for t in history]
    now=timezone.now()
    with transaction.atomic():
        claimed=AIStudySession.objects.filter(id=s.id,student=u).filter(Q(busy_until__isnull=True)|Q(busy_until__lte=now)).update(busy_until=now+timedelta(seconds=180))
        if not claimed:raise AIError('Esta sesión está procesando otra pregunta.',409)
        s.turns.filter(status='pending').update(status='failed',error='La conexión anterior se interrumpió. Puedes reintentar.')
        turn,_=AIStudyTurn.objects.update_or_create(session=s,request_id=request_id,defaults={'question':question,'sources':ids,'status':'pending','error':''})
    try:
        answer,mode,citations=respond(question,history,context,forced)
        with transaction.atomic():
            turn.answer=answer;turn.mode=mode;turn.citations=citations;turn.status='complete';turn.save(update_fields=['answer','mode','citations','status'])
            AIStudySession.objects.filter(id=s.id).update(busy_until=None,updated=timezone.now(),tutor_mode=s.tutor_mode or forced or mode=='tutor')
    except ProviderError as e:
        turn.status='failed';turn.error=str(e)[:300];turn.save(update_fields=['status','error'])
        AIStudySession.objects.filter(id=s.id).update(busy_until=None,updated=timezone.now())
        raise AIError(str(e),503)
    except Exception:
        turn.status='failed';turn.error='La pregunta no se pudo procesar. Puedes reintentar.';turn.save(update_fields=['status','error'])
        AIStudySession.objects.filter(id=s.id).update(busy_until=None)
        raise
    return state(u,s.id)

def export_session(s):
    lines=['# '+s.title,'','## Fuentes']
    for source in s.sources.order_by('id'):lines.extend(['','### '+source.title,source.url,source.content])
    lines.extend(['','## Conversación'])
    for turn in s.turns.filter(status='complete').order_by('created','id'):lines.extend(['','### Yo',turn.question,'','### Luma AI',turn.answer])
    response=HttpResponse('\n'.join(lines),content_type='text/markdown; charset=utf-8');response['Content-Disposition']='attachment; filename="luma-ai-estudio.md"';response['Cache-Control']='private, no-store';return response

def handle(request,u,path,d):
    from .permissions import authorize
    from .views import text,getcourse,integer,download
    authorize(u,'ai-study')
    if request.method=='GET':
        if path=='ai/state':return private_json(state(u,request.GET.get('session')))
        if path.startswith('ai/source/'):
            return private_json(source_data(own_source(u,path.split('/')[-1]),True))
        if path.startswith('ai/file/'):
            response=download(own_source(u,path.split('/')[-1]));response['Cache-Control']='private, no-store';return response
        if path.startswith('ai/export/'):return export_session(own_session(u,path.split('/')[-1]))
        raise AIError('Ruta de Luma AI no encontrada.',404)
    if request.method!='POST':raise AIError('Método no permitido.',405)
    if path=='ai/chat':return private_json(chat(u,d))
    if path=='ai/source':return private_json(add_source(request,u,d))
    if path=='ai/session':
        if AIStudySession.objects.filter(student=u).count()>=100:raise ValueError('Puedes guardar hasta 100 sesiones. Elimina una sesión que ya no uses.')
        course=getcourse(u,d['course']) if d.get('course') not in {None,'',0} else None
        s=AIStudySession.objects.create(student=u,title=text(d,'title',160),course=course)
        return private_json(state(u,s.id))
    if path=='ai/session-edit':
        s=own_session(u,d.get('id'));check_idle(s);s.title=text(d,'title',160)
        course_id=d.get('course')
        if course_id in {None,'',0}:s.course=None
        elif integer(course_id,1,2**63-1)!=s.course_id:s.course=getcourse(u,course_id)
        s.save(update_fields=['title','course','updated']);return private_json(state(u,s.id))
    if path=='ai/session-delete':
        s=own_session(u,d.get('id'));check_idle(s)
        with transaction.atomic():
            for source in s.sources.all():purge_file(source)
            s.delete()
        return private_json(state(u))
    if path in {'ai/source-edit','ai/source-delete'}:
        source=own_source(u,d.get('id'));check_idle(source.session);session_id=source.session_id
        with transaction.atomic():
            if path=='ai/source-delete':purge_file(source);source.delete()
            else:
                source.title=text(d,'title',180);source.content=text(d,'content',MAX_TEXT)
                source.status='ready';source.assignment=source.assignment or assignment_signal(source.title+"\n"+source.original_name+"\n"+source.content)
                source.save(update_fields=['title','content','status','assignment'])
                if source.assignment:AIStudySession.objects.filter(id=session_id).update(tutor_mode=True)
            AIStudySession.objects.filter(id=session_id).update(updated=timezone.now())
        return private_json(state(u,session_id))
    raise AIError('Ruta de Luma AI no encontrada.',404)
